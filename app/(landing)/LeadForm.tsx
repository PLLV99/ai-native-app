"use client"

import { useState } from "react"

export default function LeadForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        interest: "",
    })
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")

        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (res.ok) {
                setStatus("success")
                setMessage(data.message)
                setFormData({ name: "", email: "", phone: "", company: "", interest: "" })
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            setStatus("error")
            setMessage(error.message || "An error occurred")
        }
    }

    return (
        <section id="lead" className="py-24">
            <div className="mx-auto max-w-7xl px-6 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight">Interested in our services?</h2>
                <p className="mb-12 text-muted-foreground">Please fill out the form below and our team will get back to you.</p>

                <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 p-6 bg-white rounded-xl shadow-lg">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="email@company.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Phone Number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Company Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interested In</label>
                        <select
                            value={formData.interest}
                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a service</option>
                            <option value="ai-chatbot">Enterprise AI Chatbot</option>
                            <option value="web-development">Web Development</option>
                            <option value="consulting">IT Consulting</option>
                            <option value="training">Staff Training</option>
                        </select>
                    </div>

                    {status === "success" && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">{message}</div>
                    )}
                    {status === "error" && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{message}</div>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                    >
                        {status === "loading" ? "Sending..." : "Submit"}
                    </button>
                </form>
            </div>
        </section>
    )
}