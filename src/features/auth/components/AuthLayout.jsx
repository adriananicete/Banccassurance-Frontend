import logo from "../../../assets/PhilLife-Color.png";

/**
 * ============================================================================
 *  THIS FILE IS YOURS. Lifted out of LoginForm.jsx, markup unchanged.
 * ============================================================================
 *
 * The frame around both login steps: the logo, the title, and the card.
 *
 * It is mounted by a LAYOUT ROUTE, so it stays on screen while the route
 * beneath it changes from /login to /login/verify. Only `children` swaps --
 * the logo and the card are never unmounted, so there is no flicker and no
 * re-request of the logo.
 *
 *   children   The routed form. LoginForm on /login, OtpForm on /login/verify.
 */
export function AuthLayout({ children }) {
  return (
    <div className="w-full h-dvh flex flex-col justify-center items-center p-3 gap-10">
      <div className="w-full h-[50px] flex flex-col justify-center items-center">
        <div className="text-xs font-bold flex justify-start items-start">
          <img src={logo} width={200} alt="phillife-logo" />
        </div>

        <div className="w-auto text-lg font-bold">
          Banccassurance Referral System
        </div>
      </div>

      <div className="border rounded-sm shadow-xl flex justify-center items-center p-1">
        {children}
      </div>
    </div>
  );
}
