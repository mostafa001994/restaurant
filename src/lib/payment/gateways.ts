import { decryptSecret } from '../crypto';
import { HttpError } from '../http';

export type GatewaySetting = {
  key: string;
  sandbox: boolean;
  merchantId: string | null;
  terminalId: string | null;
  username: string | null;
  passwordEnc: string | null;
};

export type TxInfo = { orderId: number; amount: number; transactionId: string; meta: Record<string, unknown> | null };
export type StartResult = { authority: string; redirectUrl: string; meta: Record<string, unknown> };
export type VerifyResult = { success: boolean; refId: string | null; message: string | null; raw: unknown };

export interface Gateway {
  start(a: { orderId: number; amount: number; callbackUrl: string; setting: GatewaySetting }): Promise<StartResult>;
  /** params = ترکیب query و فرم POST بازگشت از بانک */
  verify(a: { params: Record<string, string>; tx: TxInfo; setting: GatewaySetting }): Promise<VerifyResult>;
  /** شناسه‌ای که بانک هنگام بازگشت برمی‌گرداند و با transactionId ذخیره‌شده تطبیق داده می‌شود */
  authorityFrom(params: Record<string, string>): string | null;
}

const TIMEOUT = 15_000;

// ───────────────────────── زرین‌پال (v4) ─────────────────────────
const ZP_SANDBOX_MERCHANT = '00000000-0000-0000-0000-000000000000';

const zarinpal: Gateway = {
  authorityFrom: (p) => p.Authority || null,

  async start({ orderId, amount, callbackUrl, setting }) {
    const api = setting.sandbox ? 'https://sandbox.zarinpal.com/pg/v4' : 'https://api.zarinpal.com/pg/v4';
    const base = setting.sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
    const res = await fetch(`${api}/payment/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: setting.merchantId || ZP_SANDBOX_MERCHANT,
        amount, // تومان
        currency: 'IRT',
        callback_url: callbackUrl,
        description: `پرداخت سفارش #${orderId}`,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { data?: { authority?: string }; errors?: { message?: string } } | null;
    const authority = data?.data?.authority;
    if (!authority) {
      console.error('[zarinpal:start]', JSON.stringify(data));
      throw new HttpError(422, data?.errors?.message ?? 'خطا در اتصال به درگاه زرین‌پال');
    }
    return { authority, redirectUrl: `${base}/pg/StartPay/${authority}`, meta: { authority } };
  },

  async verify({ params, tx, setting }) {
    if (params.Status !== 'OK' || !params.Authority) {
      return { success: false, refId: null, message: 'پرداخت توسط کاربر لغو شد', raw: params };
    }
    const api = setting.sandbox ? 'https://sandbox.zarinpal.com/pg/v4' : 'https://api.zarinpal.com/pg/v4';
    const res = await fetch(`${api}/payment/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // مبلغ و authority از رکورد تراکنش می‌آیند، نه از ورودی کاربر
      body: JSON.stringify({ merchant_id: setting.merchantId || ZP_SANDBOX_MERCHANT, amount: tx.amount, authority: tx.transactionId }),
      signal: AbortSignal.timeout(TIMEOUT),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { data?: { code?: number; ref_id?: number }; errors?: { message?: string } } | null;
    const code = data?.data?.code;
    // 100 = موفق، 101 = قبلاً verify شده
    return {
      success: code === 100 || code === 101,
      refId: data?.data?.ref_id != null ? String(data.data.ref_id) : null,
      message: data?.errors?.message ?? null,
      raw: data,
    };
  },
};

// ───────────────────────── بانک ملت (SOAP دستی؛ Node کلاینت SOAP ندارد) ─────────────────────────
const MELLAT_ENDPOINT = 'https://bpm.shaparak.ir/pgwchannel/services/pgw';
const MELLAT_NS = 'http://interfaces.core.sw.bps.com/';

const xmlEscape = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function mellatCall(method: string, fields: Record<string, string | number>): Promise<string> {
  const body = Object.entries(fields).map(([k, v]) => `<${k}>${xmlEscape(v)}</${k}>`).join('');
  const envelope =
    `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:int="${MELLAT_NS}">` +
    `<soapenv:Body><int:${method}>${body}</int:${method}></soapenv:Body></soapenv:Envelope>`;
  const res = await fetch(MELLAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: '' },
    body: envelope,
    signal: AbortSignal.timeout(TIMEOUT),
  }).catch(() => null);
  if (!res) throw new HttpError(422, 'خطا در اتصال به درگاه بانک ملت');
  const xml = await res.text();
  const m = xml.match(/<return[^>]*>([^<]*)<\/return>/);
  if (!m) {
    console.error('[mellat]', method, res.status, xml.slice(0, 300));
    throw new HttpError(422, 'پاسخ نامعتبر از درگاه بانک ملت');
  }
  return m[1]!.trim();
}

function tehranStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g('year')}${g('month')}${g('day')}`, time: `${g('hour')}${g('minute')}${g('second')}` };
}

function mellatCreds(setting: GatewaySetting) {
  const password = setting.passwordEnc ? decryptSecret(setting.passwordEnc) : null;
  if (!setting.terminalId || !setting.username || !password) {
    throw new HttpError(422, 'اطلاعات ترمینال بانک ملت هنوز در پنل ادمین تنظیم نشده است');
  }
  return { terminalId: setting.terminalId, userName: setting.username, userPassword: password };
}

const mellat: Gateway = {
  authorityFrom: (p) => p.RefId || null,

  async start({ orderId, amount, callbackUrl, setting }) {
    const creds = mellatCreds(setting);
    const bankOrderId = `${orderId}${Math.floor(Date.now() / 1000)}`; // یکتا در طول عمر ترمینال
    const { date, time } = tehranStamp();
    const ret = await mellatCall('bpPayRequest', {
      ...creds,
      orderId: bankOrderId,
      amount: amount * 10, // تومان → ریال
      localDate: date,
      localTime: time,
      additionalData: `سفارش #${orderId}`,
      callBackUrl: callbackUrl,
      payerId: 0,
    });
    const [resCode, refId] = ret.split(',');
    if (resCode !== '0' || !refId) throw new HttpError(422, `خطای بانک ملت (کد ${resCode})`);
    return {
      authority: refId,
      redirectUrl: `https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=${encodeURIComponent(refId)}`,
      meta: { order_id_bank: bankOrderId, ref_id: refId },
    };
  },

  async verify({ params, tx, setting }) {
    const { RefId: refId, ResCode: resCode, SaleOrderId: saleOrderId, SaleReferenceId: saleReferenceId } = params;
    if (resCode !== '0') return { success: false, refId: refId ?? null, message: 'پرداخت ناموفق یا لغو شد', raw: params };
    // شناسه‌ی سفارش بانکی باید همان باشد که خودمان هنگام شروع ساخته‌ایم
    if (!saleOrderId || saleOrderId !== String(tx.meta?.order_id_bank ?? '') || !saleReferenceId) {
      return { success: false, refId: refId ?? null, message: 'اطلاعات بازگشتی بانک معتبر نیست', raw: params };
    }
    const creds = mellatCreds(setting);
    const common = { ...creds, orderId: saleOrderId, saleOrderId, saleReferenceId };

    const verified = await mellatCall('bpVerifyRequest', common);
    if (verified !== '0') return { success: false, refId: refId ?? null, message: 'تایید تراکنش ناموفق بود', raw: params };

    // طبق مستندات بانک، بعد از verify باید settle انجام شود (۰ موفق، ۴۵ قبلاً settle شده)
    const settled = await mellatCall('bpSettleRequest', common).catch(() => 'error');
    if (settled !== '0' && settled !== '45') console.error('[mellat] settle failed', tx.orderId, settled);

    return { success: true, refId: saleReferenceId, message: null, raw: params };
  },
};

export const GATEWAYS: Record<string, Gateway> = { zarinpal, mellat };
export const GATEWAY_NAMES: Record<string, string> = { zarinpal: 'زرین‌پال', mellat: 'بانک ملت' };
