import React from "react";
import SettingsLayout from "../components/SettingsLayout";
import { User, Code, Mail, Linkedin, Globe, Cpu, Layers, Database } from "lucide-react";

const DeveloperPage = () => {
    return (
        <SettingsLayout>
            <div className="space-y-8 mx-auto max-w-[820px]">
                {/* Intro */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-base-content mb-2">Developer</h2>
                    <p className="text-base-content/60">Meet the creator behind Toukii</p>
                </div>

                {/* Card 1: About Developer */}
                <div className="bg-base-100 border border-base-300 rounded-2xl p-8 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:bg-primary/10 transition-colors" />

                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        {/* Avatar / Image Placeholder */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-3xl font-bold shadow-lg">
                            K
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-base-content">Kishlay Kumar</h3>
                                <p className="text-primary font-medium">Full Stack Developer</p>
                            </div>

                            <p className="text-base-content/70 leading-relaxed max-w-lg">
                                Passionate about building scalable, real-time applications and crafting intuitive user experiences.
                                Toukii represents my exploration into modern web technologies and secure communication architectures.
                            </p>

                            {/* Tech Stack Chips */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <TechChip icon={<Code size={14} />} label="MERN Stack" />
                                <TechChip icon={<Cpu size={14} />} label="WebSockets" />
                                <TechChip icon={<Database size={14} />} label="Redis" />
                                <TechChip icon={<Layers size={14} />} label="SaaS Architecture" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: About Toukii */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                                <Layers size={18} className="text-secondary" />
                                About Toukii
                            </h3>
                            <ul className="space-y-3 text-sm text-base-content/70">
                                <li className="flex justify-between">
                                    <span>Version</span>
                                    <span className="font-mono bg-base-200 px-2 py-0.5 rounded text-xs select-all">v1.2.0</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Build</span>
                                    <span>Production</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>License</span>
                                    <span>MIT</span>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-6 pt-6 border-t border-base-200 text-xs text-center text-base-content/50">
                            © 2026 Toukii. All rights reserved.
                        </div>
                    </div>

                    {/* Card 3: Contact */}
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm flex flex-col justify-center gap-4">
                        <h3 className="text-lg font-bold text-base-content mb-2">Get in Touch</h3>

                        <a href="https://kishlayspace.in" target="_blank" rel="noopener noreferrer"
                            className="btn btn-outline btn-sm justify-start gap-3 w-full normal-case">
                            <Globe size={16} />
                            Visit Portfolio
                        </a>

                        <a href="mailto:kishlay141@gmail.com"
                            className="btn btn-outline btn-sm justify-start gap-3 w-full normal-case">
                            <Mail size={16} />
                            Send Email
                        </a>

                        <a href="https://www.linkedin.com/in/kishlaykumar1/" target="_blank" rel="noopener noreferrer"
                            className="btn btn-outline btn-sm justify-start gap-3 w-full normal-case text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-600">
                            <Linkedin size={16} />
                            Connect on LinkedIn
                        </a>
                    </div>
                </div>

            </div>
        </SettingsLayout>
    );
};

const TechChip = ({ icon, label }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-base-200 text-base-content/70 border border-base-300">
        {icon}
        {label}
    </span>
);

export default DeveloperPage;
