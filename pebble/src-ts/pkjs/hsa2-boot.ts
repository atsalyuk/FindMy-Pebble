// Parses the boot_args JSON embedded in Apple's HSA2 2FA page. This is the
// only surviving piece of the retired trusted-device bridge: the boot context
// still drives 2FA routing (trusted phone number, delivery mode, auth factors).

export type Hsa2BootContext = {
  authInitialRoute: string;
  hasTrustedDevices: boolean;
  authFactors: string[];
  bridgeInitiateData: Record<string, any>;
  phoneNumberVerification: Record<string, any>;
  sourceAppId?: string;
  trustedPhoneNumber?: any;
  mode?: string;
};

export const parseHsa2BootContext = (htmlText: string): Hsa2BootContext => {
  const match = htmlText.match(/<script[^>]*class=["'][^"']*boot_args[^"']*["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) {
    throw new Error("Missing HSA2 boot args payload.");
  }
  const payload = JSON.parse(match[1]);
  const direct = payload && typeof payload === "object" ? payload.direct || {} : {};
  const twoSV = direct && typeof direct === "object" ? direct.twoSV || {} : {};
  const bridgeInitiateData =
    twoSV && typeof twoSV.bridgeInitiateData === "object" ? Object.assign({}, twoSV.bridgeInitiateData) : {};
  const phoneNumberVerification =
    bridgeInitiateData && typeof bridgeInitiateData.phoneNumberVerification === "object"
      ? Object.assign({}, bridgeInitiateData.phoneNumberVerification)
      : {};
  const trustedPhoneNumber =
    phoneNumberVerification.trustedPhoneNumber ||
    (twoSV && typeof twoSV.trustedPhoneNumber === "object" ? twoSV.trustedPhoneNumber : undefined);
  return {
    authInitialRoute: String(direct.authInitialRoute || ""),
    hasTrustedDevices: Boolean(direct.hasTrustedDevices),
    authFactors: Array.isArray(twoSV.authFactors) ? twoSV.authFactors.filter((value: any) => typeof value === "string") : [],
    bridgeInitiateData,
    phoneNumberVerification,
    sourceAppId: twoSV.sourceAppId ? String(twoSV.sourceAppId) : undefined,
    trustedPhoneNumber,
    mode: String(twoSV.mode || phoneNumberVerification.mode || "")
  };
};
