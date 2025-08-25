export async function createCheckout(email, product) {
  const res = await fetch(`/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, product }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Checkout error");
  window.location.href = data.url;
}
