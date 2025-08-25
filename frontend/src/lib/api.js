// frontend/src/lib/api.js
export async function createCheckout(email, product) {
  try {
    const res = await fetch(`/api/checkout/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, product }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    if (!data?.url) {
      throw new Error("Checkout link is missing from the server response.");
    }
    // Redirect to Lemon Squeezy
    window.location.assign(data.url);
  } catch (err) {
    alert(`Checkout failed: ${err.message}`);
    console.error("Checkout error:", err);
  }
}
