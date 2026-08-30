import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 50 },  // زيادة تدريجية حتى 50 مستخدم متزامن
    { duration: "1m", target: 100 },  // الاستمرار بـ 100 مستخدم متزامن
    { duration: "30s", target: 0 },   // تقليل تدريجي حتى الصفر
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% من الطلبات خلال أقل من ثانيتين
    http_req_failed: ["rate<0.05"],    // نسبة الفشل الإجمالية أقل من 5%
  },
};

export default function () {
  // 1. فحص صحة التطبيق
  let resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, { "health ok": (r) => r.status === 200 });

  // 2. تصفح المنتجات
  let resProducts = http.get(`${BASE_URL}/api/products?page=1&limit=12`);
  check(resProducts, { "products ok": (r) => r.status === 200 });

  // 3. البحث مع تشفير النص العربي لضمان سلامة الـ URL
  let searchQuery = encodeURIComponent("حقيبة");
  let resSearch = http.get(`${BASE_URL}/api/products?search=${searchQuery}`);
  check(resSearch, { "search ok": (r) => r.status === 200 });

  // 4. جلب التصنيفات
  let resCategories = http.get(`${BASE_URL}/api/categories`);
  check(resCategories, { "categories ok": (r) => r.status === 200 });

  sleep(1); // وقت تفكير المستخدم بين الطلبات
}