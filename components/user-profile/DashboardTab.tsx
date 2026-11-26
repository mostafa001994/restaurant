'use client';
import React from 'react';

export default function DashboardTab({ user }: { user: any }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-emerald-950">داشبورد کاربری</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-emerald-950 hover:text-white">
                <div className="bg-emerald-400 hover:bg-emerald-500 p-4 rounded text-right relative">
                    <p className="text-sm ">تعداد سفارش‌ها</p>
                    <p className="text-2xl font-bold ">{user.ordersCount ?? 0}</p>
                    <svg className="w-14 h-14 fill-emerald-200 opacity-45 z-0 absolute left-2 bottom-2">
                        <use href="#icon-orders" />
                    </svg>
                </div>
                <div className="bg-cyan-500 hover:bg-cyan-600 text-cyan-900 hover:text-white p-4 rounded text-right relative">
                    <p className="text-sm ">تعداد آدرس‌ها</p>
                    <p className="text-2xl font-bold ">{user.addressesCount ?? 0}</p>
                    <svg className="w-14 h-14 fill-cyan-200 opacity-45 z-0 absolute left-2 bottom-2">
                        <use href="#icon-location" />
                    </svg>
                </div>
                <div className="bg-teal-400 hover:bg-teal-500 text-teal-900 hover:text-white p-4 rounded text-right relative">
                    <p className="text-sm ">تعداد تیکت‌ها</p>
                    <p className="text-2xl font-bold">{user.ticketsCount ?? 0}</p>
                    <svg className="w-14 h-14 text-teal-200 opacity-45 z-0 absolute left-2 bottom-2">
                        <use href="#icon-message" />
                    </svg>
                </div>
            </div>

            <div className='flex lg:flex-nowrap flex-wrap gap-4'>
                <div className='lg:w-1/2 md:w-full shadow hover:shadow-xl bg-white rounded-2xl border-amber-300 border'>
                    <div className='flex gap-2'>

                        <span className='w-3/5 p-2 flex flex-col justify-around'>
                            <h4 className='text-black text-lg font-bold'> دعوت از دوستان</h4>
                            <p className='text-gray-800 text-sm'>
                                دوستان خود را  دعوات کنید و درامد کسب کنید
                            </p>
                            <a href="#" className='font-bold text-amber-700'> دریافت لینک</a>
                        </span>

                        <img src="/images/wallet.png" className='w-2/5' alt="" />
                    </div>

                </div>
                <div className='lg:w-1/2 md:w-full shadow hover:shadow-xl bg-white rounded-2xl border-amber-300 border'>
                    <div className='flex gap-2'>

                        <span className='w-1/2 p-2 flex flex-col justify-around'>
                            <h4 className='text-black text-lg font-bold'>پیگیری مرسوله پستی</h4>
                            <p className='text-gray-800 text-sm'>
                                برای پیگیری سفارشات خود می توانید کد پیگیری ارائه شده را در وب سایت پست وارد نمایید.
                            </p>
                            <a href="#" className='font-bold text-amber-700'> پیگیری سفارش  </a>
                        </span>

                        <img src="/images/Delivery.png" className='w-1/2' alt="" />
                    </div>

                </div>

            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2 text-emerald-950 py-3">آخرین سفارش‌ها</h3>
                <ul className="space-y-2">
                    {(user.latestOrders ?? []).map((order: any) => (
                        <li key={order.id} className="border p-3 rounded text-right">
                            <p><strong>سفارش #{order.id}</strong></p>
                            <p>وضعیت: {order.status}</p>
                            <p>تاریخ: {order.date}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

