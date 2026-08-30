namespace App\Services;

use Illuminate\Support\Facades\Http;

class TelegramService
{
    public static function sendOrderNotification($order)
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_CHAT_ID');

        if (!$token || !$chatId) {
            return;
        }

        // تنسيق تفاصيل المنتجات
        $itemsText = "";
        foreach ($order->items as $item) {
            $itemsText .= "▪️ {$item->product_name} (الكمية: {$item->quantity}) - {$item->price} ج.س\n";
        }

        $message = "🚨 *طلب جديد في متجر Leadybag!*\n\n" .
                   "📦 *رقم الطلب:* #{$order->id}\n" .
                   "👤 *اسم العميل:* {$order->customer_name}\n" .
                   "📞 *رقم الهاتف:* {$order->phone}\n" .
                   "📍 *العنوان:* {$order->address}\n\n" .
                   "🛒 *المنتجات المطلوبة:*\n" . $itemsText . "\n" .
                   "💰 *الإجمالي الكلي:* {$order->total_price} ج.س\n\n" .
                   "👇 _يرجى من موظف التوصيل استلام الطلب وتأكيد المعالجة._";

        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);
    }
}