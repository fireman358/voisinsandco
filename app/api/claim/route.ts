import { NextRequest, NextResponse } from "next/server";
import { createClaim, getBusinessById } from "@/lib/data";
import { adminNotifEmail, sendEmail } from "@/lib/email";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 5)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: { businessId?: string; name?: string; email?: string; phone?: string; bce?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    name: LIMITS.name,
    email: LIMITS.email,
    phone: LIMITS.phone,
    bce: LIMITS.bce,
    message: LIMITS.message,
    businessId: LIMITS.businessId,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const businessId = body.businessId?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  if (!businessId || !name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "businessId, name et un e-mail valide sont requis" }, { status: 400 });
  }
  const { ok, demo, created } = await createClaim({
    businessId,
    name,
    email,
    phone: phone || undefined,
    bce: body.bce?.trim() || undefined,
    message: body.message?.trim(),
  });

  // Notification e-mail à l'admin (best effort : ne bloque jamais l'enregistrement).
  if (ok && !demo && created) {
    const to = adminNotifEmail();
    if (to) {
      const business = await getBusinessById(businessId);
      const label = business?.name ?? businessId;
      await sendEmail({
        to,
        subject: `Nouvelle revendication — ${label}${business ? ` (${business.town})` : ""}`,
        text: [
          "Une nouvelle revendication vient d'être envoyée sur Le Bon Voisin.",
          "",
          `Fiche : ${label}${business ? ` — ${business.address}, ${business.postalCode} ${business.town}` : ""}`,
          `Identifiant : ${businessId}`,
          "",
          `Demandeur : ${name}`,
          `E-mail : ${email}`,
          ...(phone ? [`Téléphone : ${phone}`] : []),
          ...(body.bce?.trim() ? [`BCE indiqué : ${body.bce.trim()}`] : []),
          ...(body.message?.trim() ? ["", "Message :", body.message.trim()] : []),
          "",
          "Traiter la demande : https://lebonvoisin.org/admin",
        ].join("\n"),
      });
    }
  }

  return NextResponse.json({ ok, demo }, { status: ok ? 200 : 500 });
}
