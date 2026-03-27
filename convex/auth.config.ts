export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://working-cat-27.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
