import { useState } from "react";
import Head from "next/head";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [serverCode, setServerCode] = useState("");
  const [serverData, setServerData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerCode(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Faire la requête à l'API Discord pour obtenir des informations sur le serveur
      const response = await fetch(
        `https://discord.com/api/v9/invites/${serverCode}`
      );
      const data = await response.json();

      if (data.guild) {
        setServerData(data.guild);
        setProfileData(data.profile); // Stocker les données du profil séparément
      } else {
        throw new Error("Serveur introuvable ou code d'invitation invalide");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vérification</title>
        <meta name="description" content="Vérifiez les serveurs Discord" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Vérification de Serveur Discord</h1>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={serverCode}
              onChange={handleInputChange}
              placeholder="Entrez un code de serveur Discord"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Chargement..." : "Vérifier"}
            </button>
          </form>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {serverData && (
            <div>
              <h2>Informations sur le serveur</h2>

              {profileData?.badge_hash && serverData?.id && (
                <img
                  src={`https://cdn.discordapp.com/clan-badges/${serverData.id}/${profileData.badge_hash}.png?size=64`}
                  alt="Badge du serveur"
                  width={64}
                  height={64}
                  style={{ marginTop: "10px" }}
                />
              )}

              <p><strong>Nom du serveur:</strong> {serverData.name}</p>
              <p><strong>ID du serveur:</strong> {serverData.id}</p>
              <p><strong>Nombre de membres:</strong> {profileData?.member_count || "N/A"}</p>
              <p><strong>Code Vanity URL:</strong> {serverData.vanity_url_code || "Aucun"}</p>
              <p><strong>Tag:</strong> {profileData?.tag || "Aucun"}</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}