// src/components/ClientForm.jsx
import { useState } from "react";
import { addClient } from "../services/clientService";

function ClientForm({ onClientAdded }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addClient(form);
      alert("Client ajouté: " + res.client.name);
      setForm({ name: "", email: "", phone: "" });
      setError("");
      if (onClientAdded) onClientAdded(res.client);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur ajout client");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nom"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Téléphone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        required
      />
      <button type="submit">Ajouter</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default ClientForm;
