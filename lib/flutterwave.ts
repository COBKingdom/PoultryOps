import { PLANS } from "@/lib/plans";

export function getFlutterwavePublicKey() {
  return (
    process.env
      .NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || ""
  );
}