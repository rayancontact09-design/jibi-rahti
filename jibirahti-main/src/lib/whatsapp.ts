const PHONE = "212644411059";

const ACTIVATION_MESSAGE = "السلام عليكم، أود الحصول على كود تفعيل لتطبيق JIBI RAHTI.";

export const WHATSAPP_ACTIVATION_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(ACTIVATION_MESSAGE)}`;
