import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OSS Quest — PHOENIX Autonomous Software Recovery Engine",
  description: "Autonomous GitHub issue discovery, root-cause diagnosis, surgical patch generation, and evidence-backed sandbox verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Prevent extension-injected attributes (e.g. bis_skin_checked) from mutating DOM before React hydrates
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (name === 'bis_skin_checked') return;
                    return origSetAttr.apply(this, arguments);
                  };
                  if (typeof MutationObserver !== 'undefined') {
                    new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                          m.target.removeAttribute('bis_skin_checked');
                        }
                      }
                    }).observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
