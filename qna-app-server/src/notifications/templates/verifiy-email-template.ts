export function VerifyEmailTemplate(token: string) {
  return {
    subject: "Verify your account",
    body: `<div><h2>Hello</h2><p>Your token is ${token}, valid for 24 hours</p></div>`
  };
}
