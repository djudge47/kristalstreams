// Versioned help content shared by lists, detail pages and established support routes.
// No analytics counts, publication dates or customer account data are implied.
export interface HelpLink { title: string; url: string }
export interface HelpSection { heading: string; content: string }
export interface HelpDocument {
  title: string; description: string; sections: readonly HelpSection[]; relatedLinks?: readonly HelpLink[];
}
export interface HelpCategory { slug: string; name: string; description: string }
export interface HelpArticle extends HelpDocument { slug: string; category: string; featured: boolean }
export interface HelpGuide extends HelpDocument { slug: string; deviceType: string }

export const supportDocuments = {
  "gettingStarted": {
    "title": "Getting Started Guide",
    "description": "Follow these steps from your trial request or payment to device setup.",
    "sections": [
      {
        "heading": "1. Confirm your website account",
        "content": "Create your website account and confirm your email address. Use that email and password to sign in to your dashboard. If you forget your website password, use Forgot your password? on the sign-in page."
      },
      {
        "heading": "2. Finish your trial request or checkout",
        "content": "For a trial, return to the Free Trial page after confirming your email and click Request 36-Hour Trial. For a paid plan, review your connection count and price before continuing to secure payment. If payment verification needs attention, contact support with your order reference before paying again."
      },
      {
        "heading": "3. Check your request or order status",
        "content": "Review the status shown for your request or order in your account. A confirmed payment or website plan does not by itself mean streaming setup is ready. Streaming login details and device instructions are provided separately. If a setup message has been sent, check your inbox and spam folder; contact support if you cannot find it."
      },
      {
        "heading": "4. Use the streaming login supplied for your service",
        "content": "Your website sign-in is for account and support access. Your streaming player may use a different username, password and server address. Enter only the details supplied in your setup message, exactly as written. Keep these details private."
      },
      {
        "heading": "5. Set up your device",
        "content": "Choose the guide for your device below. Before installing or updating an app, ask support to confirm the exact approved installer for your device. Preserve an existing working installation and its saved users. The Android APK is not an Apple, Windows or Mac installer."
      },
      {
        "heading": "6. Contact support if setup is missing",
        "content": "If your confirmation arrived but you do not have streaming setup details, open a support ticket. Include your account email, trial or order reference, device model and any error message. Do not include your password or full payment card details. Streaming credentials are still supplied separately from your website account."
      }
    ],
    "relatedLinks": [
      {
        "title": "My Dashboard",
        "url": "/dashboard"
      },
      {
        "title": "Request a Free Trial",
        "url": "/free-trial"
      },
      {
        "title": "Download Apps",
        "url": "/download-app"
      },
      {
        "title": "Device Setup Guides",
        "url": "/support/devices"
      },
      {
        "title": "Open a Support Ticket",
        "url": "/client/support/new"
      }
    ]
  },
  "billing": {
    "title": "Account & Billing",
    "description": "Find your subscription details and resolve payment questions.",
    "sections": [
      {
        "heading": "Find your subscription",
        "content": "Sign in to the client area using the account associated with your purchase. Check your subscription or order details for the plan, connection allowance and expiration date. Your website account and streaming login may use different credentials."
      },
      {
        "heading": "Payment completed but service is unavailable",
        "content": "Check your payment receipt and whether the subscription is active. Restart the player and try your streaming credentials again. If access is still unavailable, contact support with your order reference, payment date and account email. Avoid submitting another payment until the first transaction has been checked."
      },
      {
        "heading": "Renewals and plan changes",
        "content": "Review the terms shown with your current order before renewing or changing plans. Ask support to confirm the effective date, total price, and whether the change affects your existing expiration date or connection allowance."
      },
      {
        "heading": "Unexpected charges or refund questions",
        "content": "Contact support with the transaction date, amount and order reference. Refund eligibility and cancellation terms depend on the terms accepted at purchase. Never include a full card number, security code, password or API key in a support message."
      }
    ],
    "relatedLinks": [
      {
        "title": "Support Tickets",
        "url": "/client/support"
      },
      {
        "title": "Contact Support",
        "url": "/support"
      }
    ]
  },
  "streaming": {
    "title": "Streaming Help",
    "description": "Identify whether playback problems affect one stream, one device or your connection.",
    "sections": [
      {
        "heading": "Check the scope",
        "content": "Try two other channels and one on-demand video. Note whether the issue affects one channel, all live TV, or all content. Compare another device if available, staying within your plan connection allowance."
      },
      {
        "heading": "Restart playback",
        "content": "Stop the stream, close and reopen the player, and try again. Refresh the channel list if your player provides that option. Restart the device if playback remains stuck."
      },
      {
        "heading": "Buffering or poor picture quality",
        "content": "Pause large downloads and cloud backups. Test the connection from the device used to watch. Try Ethernet or move closer to the router. If the player provides a quality setting, lower it temporarily to check whether the connection is the limiting factor."
      },
      {
        "heading": "Sound missing or out of sync",
        "content": "Check TV and player volume and the selected audio track. Restart the stream. If using Bluetooth headphones or a soundbar, test the TV speakers to isolate audio delay. Use the player audio-delay setting only if supported."
      },
      {
        "heading": "Send a useful problem report",
        "content": "Include the channel or title, device model, player name and version, date and time, exact error, and whether other streams work. A screenshot is useful after hiding usernames, passwords and playback URLs."
      }
    ],
    "relatedLinks": [
      {
        "title": "Buffering Issues",
        "url": "/support/buffering"
      },
      {
        "title": "Audio/Video Sync",
        "url": "/support/sync-issues"
      },
      {
        "title": "Support Tickets",
        "url": "/client/support"
      }
    ]
  },
  "tv": {
    "title": "Smart TV Setup",
    "description": "Choose the setup instructions for your exact television or streaming device.",
    "sections": [
      {
        "heading": "Before installing",
        "content": "Have your streaming setup message ready. Your website account password may be different from your player login. If you have not received streaming credentials, contact support before trying to sign in to a player."
      },
      {
        "heading": "Android TV / Google TV",
        "content": "Confirm the exact approved installer and device instructions with support before installing or updating. The Download Apps page has Android installation information. Preserve an existing working Kristal Streams installation, its saved users, data and settings. Do not uninstall or clear app data unless support asks you to."
      },
      {
        "heading": "Amazon Fire TV / Firestick",
        "content": "Use the installer and device instructions supplied by Kristal Streams. The Download Apps page contains the Android APK. Ask support if your device cannot open the download or installation is blocked; include the exact Fire TV model and error."
      },
      {
        "heading": "Samsung and LG Smart TVs",
        "content": "Confirm your TV model and operating system with support. The Android APK is not a Samsung or LG TV installer. Support must confirm a compatible playback option or external streaming device for your model before you install anything."
      },
      {
        "heading": "Sign in and check playback",
        "content": "Open the approved player and enter the streaming credentials from your setup message. If it asks for a server address, use the supplied address exactly. Let the channel list and guide load, then try a live channel and an on-demand title. Send support the exact error if either fails."
      }
    ],
    "relatedLinks": [
      {
        "title": "Download Apps",
        "url": "/download-app"
      },
      {
        "title": "Getting Started",
        "url": "/support/getting-started"
      },
      {
        "title": "Mobile Setup",
        "url": "/support/mobile-setup"
      },
      {
        "title": "Contact Support",
        "url": "/client/support/new"
      }
    ]
  },
  "mobile": {
    "title": "Mobile Setup",
    "description": "Use the setup method approved for your phone or tablet.",
    "sections": [
      {
        "heading": "Before you begin",
        "content": "A website login gives you account and support access. Streaming credentials and setup instructions are supplied separately. If those details have not arrived, check your inbox and spam folder, then contact support."
      },
      {
        "heading": "Android phones and tablets",
        "content": "Confirm the approved Android installer for your phone or tablet with support, then follow the installation instructions on the Download Apps page. When updating an existing installation, preserve its saved users, settings and data unless support specifically asks otherwise."
      },
      {
        "heading": "Sign in to the Android player",
        "content": "Open the installed Kristal Streams player and use the streaming username and password supplied for your service. If the player requests a server address, enter only the supplied address. Allow the channel list and guide to load before checking playback."
      },
      {
        "heading": "iPhone / iPad",
        "content": "The Kristal Streams Apple app download is currently unavailable. Contact support with your device model and iOS or iPadOS version to confirm an approved playback option. Do not install the Android APK on an Apple device."
      },
      {
        "heading": "Using the website on your phone",
        "content": "You can use the website to request a trial, review plans, manage your account and contact support. Installing the website as a web app provides a shortcut to these pages. Browser playback requires a separately confirmed player and setup instructions."
      }
    ],
    "relatedLinks": [
      {
        "title": "Download Apps",
        "url": "/download-app"
      },
      {
        "title": "TV Setup",
        "url": "/support/tv-setup"
      },
      {
        "title": "Getting Started",
        "url": "/support/getting-started"
      },
      {
        "title": "Contact Support",
        "url": "/client/support/new"
      }
    ]
  },
  "computer": {
    "title": "Computer Setup",
    "description": "Confirm the playback method for your Windows or Mac computer.",
    "sections": [
      {
        "heading": "Website account access",
        "content": "Use the Kristal Streams website to review plans, check your account and contact support. The dashboard manages your website account; streaming access uses the player and login details supplied separately for your service."
      },
      {
        "heading": "Choose an approved playback method",
        "content": "Contact support with your computer operating system and preferred browser. Ask for the current approved computer player or web player address and its setup instructions. Do not guess a player URL or use your website password in an unrelated app."
      },
      {
        "heading": "Enter your supplied streaming details",
        "content": "If your approved player asks for a username, password, server address or playlist URL, enter exactly what was provided in your setup message. Keep playlist links and login details private. The Android APK on the download page is not a Windows or Mac installer."
      },
      {
        "heading": "Check playback and get help",
        "content": "Allow the channel list to load, then try a live channel and an on-demand title. If playback fails, note the player or browser version, computer operating system and exact error. Include that information in your support ticket, without sending passwords."
      }
    ],
    "relatedLinks": [
      {
        "title": "Getting Started",
        "url": "/support/getting-started"
      },
      {
        "title": "Browser Support",
        "url": "/support/browsers"
      },
      {
        "title": "Mobile Setup",
        "url": "/support/mobile-setup"
      },
      {
        "title": "Contact Support",
        "url": "/client/support/new"
      }
    ]
  },
  "console": {
    "title": "Gaming Console Setup",
    "description": "Confirm support for your exact console before choosing a playback method.",
    "sections": [
      {
        "heading": "Check compatibility first",
        "content": "Send support your console model and operating system version. There is no verified Kristal Streams console installer linked from this website. Support must confirm any approved player, browser or casting method for your model."
      },
      {
        "heading": "Use only confirmed instructions",
        "content": "Do not assume that a console browser or an app with IPTV in its name will work with your service. If support confirms a method, follow the supplied setup instructions and use the streaming login provided for your account."
      },
      {
        "heading": "Alternative devices",
        "content": "If your console has no approved playback option, ask support about a compatible Android streaming device, television or phone. Confirm the exact model before buying or installing anything."
      }
    ],
    "relatedLinks": [
      {
        "title": "TV Setup",
        "url": "/support/tv-setup"
      },
      {
        "title": "Mobile Setup",
        "url": "/support/mobile-setup"
      },
      {
        "title": "Contact Support",
        "url": "/client/support/new"
      }
    ]
  },
  "account": {
    "title": "Setting Up Your Account",
    "description": "Keep website account access separate from the streaming login supplied for your service.",
    "sections": [
      {
        "heading": "Create and confirm your website account",
        "content": "Use your email address when registering, then follow the email-confirmation instructions. Sign in to the website with that account. If you cannot find the confirmation message, check spam and contact support; do not share your password."
      },
      {
        "heading": "Use the correct login",
        "content": "Your website sign-in manages your account and support requests. Your streaming player can use a different username, password and server address. Enter only the streaming details supplied for your service."
      },
      {
        "heading": "Review your service details",
        "content": "Your Subscription page can show saved streaming service once your website account has been securely linked to the correct customer record. A missing link does not mean the service is unpaid or inactive. Contact support to verify ownership; a matching name alone is not proof."
      },
      {
        "heading": "Get help with access",
        "content": "Use Forgot your password? on the website sign-in page for a website password reset. For a streaming login problem, contact support with your device model and error message. Never post passwords or full playback URLs in a ticket."
      }
    ],
    "relatedLinks": [
      {
        "title": "Sign in",
        "url": "/login"
      },
      {
        "title": "Register",
        "url": "/register"
      },
      {
        "title": "My Subscription",
        "url": "/client/subscription"
      },
      {
        "title": "Contact Support",
        "url": "/client/support/new"
      }
    ]
  },
  "devices": {
    "title": "Choose Your Device",
    "description": "Find setup instructions for the device you already use.",
    "sections": [
      {
        "heading": "Choose the matching guide",
        "content": "Use the TV guide for televisions and streaming devices, the mobile guide for phones and tablets, and the computer or console guide for those devices. Compatibility depends on the exact model and operating system; ask support if your device is not covered."
      },
      {
        "heading": "Keep your current setup safe",
        "content": "Before an update, confirm the exact approved installer with support. Preserve a working app and its saved users. Do not uninstall the app or clear its data just to test a guide."
      }
    ],
    "relatedLinks": [
      {
        "title": "TV and Streaming Devices",
        "url": "/support/guide/tv-setup"
      },
      {
        "title": "Phones and Tablets",
        "url": "/support/guide/mobile-setup"
      },
      {
        "title": "Computers",
        "url": "/support/guide/computer-setup"
      },
      {
        "title": "Game Consoles",
        "url": "/support/guide/console-setup"
      }
    ]
  }
} satisfies Record<string, HelpDocument>;

export const helpCategories: readonly HelpCategory[] = [
  {slug:'getting-started',name:'Getting Started',description:'Website accounts, service access and first steps.'},
  {slug:'billing',name:'Account & Billing',description:'Recorded payments, renewals and plan changes.'},
  {slug:'technical',name:'Technical Support',description:'Playback, buffering and audio troubleshooting.'},
  {slug:'device-setup',name:'Device Setup',description:'Find the instructions for your exact device.'},
];

export const helpArticles: readonly HelpArticle[] = [
  {...supportDocuments.gettingStarted,slug:'getting-started-guide',category:'getting-started',featured:true},
  {...supportDocuments.account,slug:'account-setup',category:'getting-started',featured:true},
  {...supportDocuments.billing,slug:'billing-and-renewals',category:'billing',featured:false},
  {...supportDocuments.streaming,slug:'streaming-troubleshooting',category:'technical',featured:false},
  {...supportDocuments.devices,slug:'choose-your-device',category:'device-setup',featured:false},
];

export const setupGuides: readonly HelpGuide[] = [
  {...supportDocuments.tv,slug:'tv-setup',deviceType:'TVs and streaming devices'},
  {...supportDocuments.mobile,slug:'mobile-setup',deviceType:'Phones and tablets'},
  {...supportDocuments.computer,slug:'computer-setup',deviceType:'Windows and Mac computers'},
  {...supportDocuments.console,slug:'console-setup',deviceType:'Game consoles'},
];

export const findHelpArticle = (slug?: string) => helpArticles.find(article => article.slug === slug);
export const findSetupGuide = (slug?: string) => setupGuides.find(guide => guide.slug === slug);
export function filterHelpArticles(category: string, query: string) {
  const term = query.trim().toLocaleLowerCase('en-US');
  return helpArticles.filter(article => (!category || article.category === category)
    && [article.title,article.description,...article.sections.flatMap(section=>[section.heading,section.content])]
      .join(' ').toLocaleLowerCase('en-US').includes(term));
}
