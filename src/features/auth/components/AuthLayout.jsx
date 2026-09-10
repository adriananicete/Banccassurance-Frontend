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
 *
 * Every class below was copied from your LoginForm exactly as written,
 * including `justif-center` on the card -- see the note in the commit. It is
 * a dead class today, so correcting the spelling would change the layout
 * rather than leave it alone, which is your call and not mine.
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

      <div className="border rounded-sm shadow-xl flex justif-center items-center p-1">
        {children}
      </div>
    </div>
  );
}
