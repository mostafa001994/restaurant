export type FormType = {
  name: string;
  email: string;   // حتما string
  phone: string;   // حتما string
  avatar_url?: string;
};



export type ProfileTabProps = {
  user: {
    id: number | string;
    name: string;
    phone?: string | null;
    phone_verified_at?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
  setUser: React.Dispatch<React.SetStateAction<any>>;
  
  form: FormType; // ✅ به جای تعریف جدا
  setForm: React.Dispatch<React.SetStateAction<FormType>>; // ✅ تایپ دقیق
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
};

