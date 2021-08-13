import * as axios from "axios";

export const verifyRecaptchaFunctions = {
  async verifyRecaptcha(recaptchaToken: string) {
    const payload = {
      secret: process.env.GOOGLE_RECAPTCHA_SECRET,
      response: recaptchaToken,
      remoteip: undefined,
    };
    const verifyResponse = await axios.default({
      method: "post",
      url: "https://www.google.com/recaptcha/api/siteverify",
      params: payload,
    });
    return verifyResponse.data.success;
  },
};
