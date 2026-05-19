const CREDIT_URL = "https://www.franciscoandrade.com.ar";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <a
        className="site-footer-link"
        href={CREDIT_URL}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span>created by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/image/FranLogo.png"
          alt=""
          width={14}
          height={14}
          className="site-footer-logo"
        />
        <span>francisco andrade</span>
      </a>
    </footer>
  );
}
