import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    const clientID = process.env["GOOGLE_CLIENT_ID"];
    const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    const callbackURL = process.env["GOOGLE_CALLBACK_URL"] ?? "/auth/google/callback";

    if (!clientID || !clientSecret) {
      // Google OAuth is optional - if not configured, this strategy won't work
      // but the app can still function with email/password auth
      super({
        clientID: "not-configured",
        clientSecret: "not-configured",
        callbackURL,
        scope: ["email", "profile"],
      });
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("No email found in Google profile"), undefined);
      return;
    }

    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
    };

    done(null, googleProfile);
  }
}
