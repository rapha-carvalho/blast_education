/**
 * Utility functions for pushing GA4 events via gtag.
 * These correspond to specific interactions in the education.blastgroup.org platform.
 */

// Helper to push to gtag safely
const pushToGtag = (eventName, params) => {
    if (typeof window !== "undefined") {
        if (typeof window.gtag === "function") {
            window.gtag("event", eventName, params);
        } else if (window.dataLayer) {
            // Fallback in case gtag is not initialized but dataLayer exists
            window.dataLayer.push({ event: eventName, ...params });
        }
    }
};

const pushToMetaPixel = (eventName, params) => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        if (typeof params === "undefined") {
            window.fbq("track", eventName);
            return;
        }
        window.fbq("track", eventName, params);
    }
};

export const trackMetaPageView = () => {
    pushToMetaPixel("PageView");
};

export const trackCheckoutStart = (hasPromo, promoCode, valueCents) => {
    const value = valueCents ? valueCents / 100 : undefined;
    pushToGtag("begin_checkout", {
        currency: "BRL",
        value: value,
        coupon: hasPromo ? promoCode : undefined,
        items: [
            {
                item_id: "sql_zero_avancado",
                item_name: "SQL do Zero ao Avançado",
                price: value,
                quantity: 1
            }
        ]
    });
};

export const trackPaymentInfo = (installmentCount, valueCents) => {
    const value = valueCents ? valueCents / 100 : undefined;
    pushToGtag("add_payment_info", {
        currency: "BRL",
        value: value,
        payment_type: installmentCount === 1 ? "Pix ou Cartão" : `Cartão parcelado em ${installmentCount}x`,
        items: [
            {
                item_id: "sql_zero_avancado",
                item_name: "SQL do Zero ao Avançado",
                price: value,
                quantity: 1
            }
        ]
    });
};

export const trackPromoApplied = (promoCode, discountAmount) => {
    pushToGtag("coupon_applied", {
        coupon_code: promoCode,
        discount_amount: discountAmount
    });
};

export const trackLogin = (method = "email") => {
    pushToGtag("login", {
        method: method
    });
};

export const trackLoginError = (errorMessage) => {
    pushToGtag("login_error", {
        error_message: errorMessage
    });
};

export const trackSqlRun = (context, success) => {
    // context can be the lesson id, or "playground_free", "playground_exec"
    pushToGtag("run_sql_editor", {
        sql_context: context,
        success: success
    });
};

export const trackChallengeValidate = (context, challengeIndex, success) => {
    pushToGtag("challenge_validate", {
        sql_context: context,
        challenge_index: challengeIndex,
        success: success
    });
};

export const trackLessonComplete = (lessonId) => {
    pushToGtag("lesson_complete", {
        lesson_id: lessonId
    });
};
