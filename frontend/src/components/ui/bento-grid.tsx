"use client";

import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/ui/spotlight-card";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
    onClick?: () => void;
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <GlowCard
                    key={index}
                    className={cn(
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
                    )}
                >
                <div
                    onClick={item.onClick}
                    className={cn(
                        "group relative p-4 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
                        "bg-card/60 backdrop-blur-xl",
                        "hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-card/80",
                        "hover:-translate-y-0.5 will-change-transform",
                        {
                            "shadow-[0_2px_12px_rgba(0,0,0,0.15)] -translate-y-0.5 bg-card/80":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
                    </div>

                    <div className="relative flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 group-hover:bg-gradient-to-br group-hover:from-sky-500/20 group-hover:to-violet-600/20 transition-all duration-300">
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm",
                                    "bg-white/10 text-muted-foreground",
                                    "transition-colors duration-300 group-hover:bg-white/20"
                                )}
                            >
                                {item.status || "Active"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium text-foreground tracking-tight text-[15px]">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-snug">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.cta || "Explore →"}
                            </span>
                        </div>
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-white/10 to-transparent ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    />
                </div>
                </GlowCard>
            ))}
        </div>
    );
}

export { BentoGrid };
