import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DevicePrice = {
  count: number;
  price: number;
};

type Plan = {
  name: string;
  duration: string;
  badge?: string;
  description: string;
  devices: DevicePrice[];
};

const pricingOptions: Plan[] = [
  {
    name: "Bronze",
    duration: "1 Month",
    description: "Great for getting started",
    devices: [
      { count: 1, price: 20 },
      { count: 2, price: 35 },
      { count: 3, price: 50 },
      { count: 4, price: 65 },
      { count: 5, price: 80 },
    ],
  },
  {
    name: "Silver",
    duration: "3 Months • 27.8% OFF",
    description: "More time, better value",
    devices: [
      { count: 1, price: 45 },
      { count: 2, price: 75 },
      { count: 3, price: 110 },
      { count: 4, price: 140 },
      { count: 5, price: 175 },
    ],
  },
  {
    name: "Gold",
    duration: "6 Months • 50% OFF",
    badge: "Most Popular",
    description: "The best balance of value and savings",
    devices: [
      { count: 1, price: 60 },
      { count: 2, price: 105 },
      { count: 3, price: 150 },
      { count: 4, price: 195 },
      { count: 5, price: 240 },
    ],
  },
  {
    name: "Platinum",
    duration: "12 Months • 61.1% OFF",
    badge: "Best Value",
    description: "Maximum savings for long-term access",
    devices: [
      { count: 1, price: 95 },
      { count: 2, price: 165 },
      { count: 3, price: 235 },
      { count: 4, price: 305 },
      { count: 5, price: 375 },
    ],
  },
];

const features = [
  "21,000+ Channels",
  "Movies & Series",
  "4K / HD Streaming",
  "Fast Activation",
  "24/7 Support",
];

export default function PricingPlans() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-gradient-to-b from-black via-zinc-950 to-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Pricing Plans
          </p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Choose the plan that fits your setup
          </h2>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Premium streaming plans with flexible device options and stronger
            savings as you move up.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {pricingOptions.map((plan) => {
            const isHighlighted =
              plan.badge === "Most Popular" || plan.badge === "Best Value";

            return (
              <div
                key={plan.name}
                className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl transition duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? "border-red-500/80 bg-white/5"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-bold ${
                    isHighlighted ? "text-red-500" : "text-white"
                  }`}>{plan.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{plan.duration}</p>
                  <p className="mt-3 text-sm text-zinc-300">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-400">
                    Device Pricing
                  </p>

                  <div className="space-y-3">
                    {plan.devices.map((device) => (
                      <div
                        key={device.count}
                        onClick={() =>
                          navigate(`/pricing/${plan.name.toLowerCase()}`, {
                            state: {
                              tier: plan.name.toLowerCase(),
                              months: plan.name === 'Bronze' ? 1 : plan.name === 'Silver' ? 3 : plan.name === 'Gold' ? 6 : 12,
                              connections: device.count,
                              duration: plan.duration
                            }
                          })
                        }
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 cursor-pointer hover:bg-white/10 transition"
                      >
                        <span className="text-sm text-zinc-300">
                          {device.count} Connection
                          {device.count > 1 ? "s" : ""}
                        </span>
                        <span className="text-lg font-semibold text-white">
                          ${device.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-400">
                    Included
                  </p>

                  <ul className="space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm text-zinc-300"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                          <Check size={14} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() =>
                    navigate(`/pricing/${plan.name.toLowerCase()}`, {
                      state: {
                        tier: plan.name.toLowerCase(),
                        months: plan.name === 'Bronze' ? 1 : plan.name === 'Silver' ? 3 : plan.name === 'Gold' ? 6 : 12,
                        connections: 1,
                        duration: plan.duration
                      }
                    })
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isHighlighted
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  Buy Now
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}