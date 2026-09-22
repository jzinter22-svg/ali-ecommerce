// config.js
// مُتتبَّع في المستودع عمداً: url و anonKey هنا مُصمَّمان ليكونا علنيَّين في كود
// المتصفح (Supabase "anon/publishable key")، وليس سرًّا يجب إخفاؤه. الحماية
// الفعلية لبيانات القاعدة هي سياسات RLS المُفعَّلة على كل الجداول، لا سرّية هذا
// الملف. لا تضع هنا service_role key أو أي مفتاح آخر غير مخصَّص للمتصفح.

window.SUPABASE_CONFIG = {
  url: "https://vwqmwgilzoidhrifoydg.supabase.co",
  anonKey: "sb_publishable_AZOaedPcZbxTSMQSZPK53A_eoc2M7Fb",
};
