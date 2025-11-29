import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface VerificationRequest {
  email: string;
  userId: string;
}

// Gerar token de verificação
export async function generateVerificationToken(
  email: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  try {
    await supabase
      .from("email_verification_tokens")
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });
  } catch (err) {
    console.error("Token creation error:", err);
  }

  return token;
}

// POST: Criar token e enviar email
export async function POST(request: NextRequest) {
  try {
    const body: VerificationRequest = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing email or userId" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email_verified")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Se já foi verificado, retornar sucesso
    if (user.email_verified) {
      return NextResponse.json({
        message: "Email already verified",
        verified: true,
      });
    }

    // Gerar token
    const token = await generateVerificationToken(email);

    // Enviar email com token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "confirmation",
          email,
          data: {
            verificationToken: token,
            userName: email?.split("@")[0],
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Verification token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Verificar token e marcar como verificado
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing token or email" },
        { status: 400 }
      );
    }

    // Buscar token no banco
    const { data: verificationData, error: verificationError } = await supabase
      .from("email_verification_tokens")
      .select("id, expires_at")
      .eq("token", token)
      .eq("email", email)
      .single();

    if (verificationError || !verificationData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Verificar se expirou
    const expiresAt = new Date(verificationData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Atualizar usuário como verificado
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      );
    }

    // Deletar token após uso
    try {
      await supabase
        .from("email_verification_tokens")
        .delete()
        .eq("id", verificationData.id);
    } catch (err) {
      console.error("Token deletion error:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
