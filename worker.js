// ============================================================
// ⭐ TELEGRAM APP RATING BOT
// Cloudflare Workers - Free
// Owner ID: 6891530912
// ============================================================

// ضع BOT TOKEN في Cloudflare Secret باسم:
// BOT_TOKEN
//
// لا تضع التوكن داخل GitHub أو داخل هذا الملف.

const OWNER_ID = 6891530912;

// ------------------------------------------------------------
// رسالة الترحيب
// ------------------------------------------------------------
const WELCOME_MESSAGE = `
<b>🌟 مرحبًا بك!</b>

يسعدنا جدًا وجودك معنا 🤍
رأيك مهم بالنسبة لنا ويساعدنا على تحسين التطبيق وتطويره باستمرار.

<blockquote>﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾
<small>سورة طه — الآية 114</small></blockquote>

<b>⭐ كيف تقيّم تجربتك مع التطبيق؟</b>
اختر تقييمك من النجمة إلى خمس نجوم 👇
`;

// ------------------------------------------------------------
// Telegram API
// ------------------------------------------------------------
async function telegram(method, data, env) {
    const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

// ------------------------------------------------------------
// Escape HTML
// ------------------------------------------------------------
function escapeHTML(text) {
    if (text === undefined || text === null) return "";

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ------------------------------------------------------------
// رابط المستخدم
// ------------------------------------------------------------
function userMention(user) {
    const name = escapeHTML(
        [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "بدون اسم"
    );

    return `<a href="tg://user?id=${user.id}">${name}</a>`;
}

// ------------------------------------------------------------
// لوحة التقييم
// ------------------------------------------------------------
function ratingKeyboard() {
    return {
        inline_keyboard: [
            [
                {
                    text: "⭐",
                    callback_data: "rate_1",
                    style: "danger"
                },
                {
                    text: "⭐⭐",
                    callback_data: "rate_2",
                    style: "danger"
                },
                {
                    text: "⭐⭐⭐",
                    callback_data: "rate_3",
                    style: "primary"
                },
                {
                    text: "⭐⭐⭐⭐",
                    callback_data: "rate_4",
                    style: "success"
                },
                {
                    text: "⭐⭐⭐⭐⭐",
                    callback_data: "rate_5",
                    style: "success"
                }
            ]
        ]
    };
}

// ------------------------------------------------------------
// إزالة الأزرار بعد التقييم
// ------------------------------------------------------------
async function removeKeyboard(chatId, messageId, env) {
    return await telegram(
        "editMessageReplyMarkup",
        {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: []
            }
        },
        env
    );
}

// ------------------------------------------------------------
// استقبال /start
// ------------------------------------------------------------
async function handleStart(message, env) {
    const chatId = message.chat.id;

    await telegram(
        "sendMessage",
        {
            chat_id: chatId,
            text: WELCOME_MESSAGE,
            parse_mode: "HTML",
            reply_markup: ratingKeyboard()
        },
        env
    );
}

// ------------------------------------------------------------
// استقبال التقييم
// ------------------------------------------------------------
async function handleRating(callbackQuery, env) {
    const data = callbackQuery.data || "";

    if (!data.startsWith("rate_")) {
        return;
    }

    const rating = Number(data.replace("rate_", ""));

    if (![1, 2, 3, 4, 5].includes(rating)) {
        return;
    }

    const user = callbackQuery.from;
    const chat = callbackQuery.message?.chat;

    // --------------------------------------------------------
    // إيقاف تحميل الزر
    // --------------------------------------------------------
    await telegram(
        "answerCallbackQuery",
        {
            callback_query_id: callbackQuery.id,
            text: `تم تسجيل تقييمك: ${"⭐".repeat(rating)}`,
            show_alert: false
        },
        env
    );

    // --------------------------------------------------------
    // إزالة الأزرار من الرسالة
    // --------------------------------------------------------
    if (chat && callbackQuery.message?.message_id) {
        await removeKeyboard(
            chat.id,
            callbackQuery.message.message_id,
            env
        );
    }

    // --------------------------------------------------------
    // بيانات المستخدم
    // --------------------------------------------------------
    const fullName =
        [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "بدون اسم";

    const username = user.username
        ? `@${user.username}`
        : "لا يوجد";

    const language = user.language_code
        ? user.language_code
        : "غير معروف";

    const isPremium = user.is_premium ? "نعم ⭐" : "لا";

    // --------------------------------------------------------
    // الوقت
    // --------------------------------------------------------
    const now = new Date();

    const time = now.toLocaleString("en-GB", {
        timeZone: "Africa/Algiers",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    // --------------------------------------------------------
    // رسالة التقييم للمالك
    // --------------------------------------------------------
    const ownerMessage = `
<b>━━━━━━━━━━━━━━━━━━━━</b>
<b>⭐ تقييم جديد للتطبيق</b>
<b>━━━━━━━━━━━━━━━━━━━━</b>

<b>التقييم:</b>
${"⭐".repeat(rating)} <b>(${rating}/5)</b>

<b>👤 معلومات المستخدم</b>
<blockquote>
<b>الاسم:</b> ${escapeHTML(fullName)}
<b>المعرف:</b> <code>${user.id}</code>
<b>Username:</b> ${escapeHTML(username)}
<b>اللغة:</b> ${escapeHTML(language)}
<b>Premium:</b> ${isPremium}
</blockquote>

<b>🆔 Chat ID:</b>
<code>${chat?.id ?? user.id}</code>

<b>🕐 وقت التقييم:</b>
<code>${time}</code>

<b>🔗 فتح الحساب:</b>
${userMention(user)}

<b>━━━━━━━━━━━━━━━━━━━━</b>
`;

    // --------------------------------------------------------
    // إرسال التقييم للمالك
    // --------------------------------------------------------
    const result = await telegram(
        "sendMessage",
        {
            chat_id: OWNER_ID,
            text: ownerMessage,
            parse_mode: "HTML",
            disable_web_page_preview: true
        },
        env
    );

    // --------------------------------------------------------
    // تأكيد للمستخدم
    // --------------------------------------------------------
    if (result.ok && chat) {
        await telegram(
            "sendMessage",
            {
                chat_id: chat.id,
                text: `
<b>✅ شكرًا لك!</b>

تم تسجيل تقييمك بنجاح:
<b>${"⭐".repeat(rating)}</b>

رأيك يعني لنا الكثير 🤍
`,
                parse_mode: "HTML"
            },
            env
        );
    }
}

// ------------------------------------------------------------
// Webhook
// ------------------------------------------------------------
async function handleWebhook(request, env) {
    let update;

    try {
        update = await request.json();
    } catch {
        return new Response("Invalid JSON", {
            status: 400
        });
    }

    // --------------------------------------------------------
    // رسالة
    // --------------------------------------------------------
    if (update.message) {
        const message = update.message;

        if (
            message.text &&
            message.text.startsWith("/start")
        ) {
            await handleStart(message, env);
        }

        return new Response("OK");
    }

    // --------------------------------------------------------
    // Callback Query
    // --------------------------------------------------------
    if (update.callback_query) {
        await handleRating(update.callback_query, env);

        return new Response("OK");
    }

    return new Response("OK");
}

// ------------------------------------------------------------
// Worker
// ------------------------------------------------------------
export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);

            // ------------------------------------------------
            // الصفحة الرئيسية
            // ------------------------------------------------
            if (request.method === "GET") {
                return new Response(
                    "✅ Telegram Rating Bot is running.",
                    {
                        status: 200,
                        headers: {
                            "content-type": "text/plain; charset=UTF-8"
                        }
                    }
                );
            }

            // ------------------------------------------------
            // Webhook
            // ------------------------------------------------
            if (
                request.method === "POST" &&
                url.pathname === "/webhook"
            ) {
                return await handleWebhook(request, env);
            }

            return new Response("Not Found", {
                status: 404
            });

        } catch (error) {
            console.error(error);

            return new Response("Internal Server Error", {
                status: 500
            });
        }
    }
};
