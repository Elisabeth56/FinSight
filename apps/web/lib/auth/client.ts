"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Browser auth client. Talks to this site's /api/auth proxy, which forwards to Neon Auth. */
export const authClient = createAuthClient();
