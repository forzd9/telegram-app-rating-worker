// ============================================================
// ⭐ TELEGRAM RATING BOT - CLOUDFLARE WORKER
// ============================================================



const WELCOME_MESSAGE = `
<b>🌟 مرحبًا بك في م | آيات 🤍</b>

<blockquote>﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾
<small>سورة طه — الآية 114</small></blockquote>

<b>⭐ ما تقييمك لتطبيقنا؟</b>
اختر تقييمك من 1 إلى 5 نجوم 👇
`;

function keyboard() {
    return {
        inline_keyboard: [[
            { text: "⭐", callback_data: "rate_1", style: "danger" },
            { text: "⭐⭐", callback_data: "rate_2", style: "danger" },
            { text: "⭐⭐⭐", callback_data: "rate_3", style: "primary" },
            { text: "⭐⭐⭐⭐", callback_data: "rate_4", style: "success" },
            { text: "⭐⭐⭐⭐⭐", callback_data: "rate_5", style: "success" }
        ]]
    };
}

async function tg(api, method, data) {
    const response = await fetch(`${api}/${method}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

function escapeHTML(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function start(message, api) {
    await tg(api, "sendMessage", {
        chat_id: message.chat.id,
        text: WELCOME_MESSAGE,
        parse_mode: "HTML",
        reply_markup: keyboard()
    });
}

async function rating(query, api, ownerId) {
    const rating = Number(query.data.replace("rate_", ""));

    if (![1, 2, 3, 4, 5].includes(rating)) return;

    const user = query.from;
    const chatId = query.message.chat.id;

    await tg(api, "answerCallbackQuery", {
        callback_query_id: query.id,
        text: `تم تسجيل تقييمك ${"⭐".repeat(rating)}`
    });

    await tg(api, "editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: {
            inline_keyboard: []
        }
    });

    const name = [
        user.first_name,
        user.last_name
    ].filter(Boolean).join(" ") || "بدون اسم";

    const username = user.username
        ? `@${user.username}`
        : "لا يوجد";

    const time = new Date().toLocaleString("ar-DZ", {
        timeZone: "Africa/Algiers"
    });

    const ownerMessage = `
<b>━━━━━━━━━━━━━━━━━━━━</b>
<b>⭐ تقييم جديد للتطبيق</b>
<b>━━━━━━━━━━━━━━━━━━━━</b>

<b>التقييم:</b>
${"⭐".repeat(rating)} <b>(${rating}/5)</b>

<b>👤 معلومات المستخدم</b>
<blockquote>
<b>الاسم:</b> ${escapeHTML(name)}
<b>Username:</b> ${escapeHTML(username)}
<b>Telegram ID:</b> <code>${user.id}</code>
<b>اللغة:</b> ${escapeHTML(user.language_code || "غير معروف")}
<b>Premium:</b> ${user.is_premium ? "نعم ⭐" : "لا"}
</blockquote>

<b>🆔 Chat ID:</b>
<code>${chatId}</code>

<b>🕐 وقت التقييم:</b>
<code>${escapeHTML(time)}</code>

<b>🔗 الحساب:</b>
<a href="tg://user?id=${user.id}">فتح حساب المستخدم</a>

<b>━━━━━━━━━━━━━━━━━━━━</b>
`;

    const result = await tg(api, "sendMessage", {
        chat_id: ownerId,
        text: ownerMessage,
        parse_mode: "HTML",
        disable_web_page_preview: true
    });

    if (result.ok) {
        await tg(api, "sendMessage", {
            chat_id: chatId,
            text: `
<b>✅ شكرًا لك!</b>

تم تسجيل تقييمك بنجاح:
<b>${"⭐".repeat(rating)}</b>

🤍 رأيك يعني لنا الكثير.
`,
            parse_mode: "HTML"
        });
    }
}

export default {
    async fetch(request, env) {

        if (request.method === "GET") {
            return new Response(
                "✅ Telegram Rating Bot is running."
            );
        }
        const botToken = env?.BOT_TOKEN;
        const ownerId = Number(env?.OWNER_ID);
        if (!botToken || !Number.isSafeInteger(ownerId)) {
            return new Response("Worker secrets are not configured.", { status: 500 });
        }
        const api = `https://api.telegram.org/bot${botToken}`;

        if (
            request.method !== "POST" ||
            new URL(request.url).pathname !== "/webhook"
        ) {
            return new Response("Not Found", {
                status: 404
            });
        }

        try {
            const update = await request.json();

            if (update.message?.text?.startsWith("/start")) {
                await start(update.message, api);
            }

            if (update.callback_query) {
                await rating(update.callback_query, api, ownerId);
            }

            return new Response("OK");

        } catch (error) {
            console.error("ERROR:", error);

            return new Response("Internal Server Error", {
                status: 500
            });
        }
    }
};
