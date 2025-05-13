import { useState } from "react";
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function Home() {
  const [serverCode, setServerCode] = useState("");
  const [serverData, setServerData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [existingServers, setExistingServers] = useState<any[]>([]);

  useEffect(() => {
    const fetchExistingServers = async () => {
      const { data, error } = await supabase
        .from("discord_tags")
        .select("*")
        .not("tag", "is", null); // s’assure qu’il y a un tag

      if (error) {
        console.error("Erreur lors du chargement des serveurs :", error);
      } else {
        setExistingServers(data);
      }
    };

    fetchExistingServers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerCode(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`https://discord.com/api/v9/invites/${serverCode}`);
      const data = await response.json();

      if (data.guild) {
        setServerData(data.guild);
        setProfileData(data.profile);

        const tag = data.profile?.tag;

        if (tag) {
          const { data: existing, error: selectError } = await supabase
            .from("discord_tags")
            .select("id")
            .eq("tag", tag)
            .maybeSingle();

          if (selectError) {
            console.error(selectError);
            setStatus("Erreur lors de la vérification dans la base de données.");
          } else if (existing) {
            setStatus("Ce tag est déjà dans la base de données.");
          } else {
            // Sinon on insère
            const { error: insertError } = await supabase.from("discord_tags").insert({
              id: data.guild.id,
              name: data.guild.name,
              tag: tag,
              vanity_url: data.guild.vanity_url_code,
              badge_hash: data.profile.badge_hash,
            });

            if (insertError) {
              console.error(insertError);
              setStatus("Erreur lors de l'ajout à la base de données.");
            } else {
              setStatus("Serveur ajouté à la base de données !");
            }
          }
        } else {
          setStatus("Ce serveur n’a pas de tag, il n’a pas été ajouté.");
        }
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
        <title>Guildtag</title>
        <meta name="description" content="Vérifiez les serveurs Discord" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Servers tags</h1>
          
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
          {status && <p style={{ color: "green" }}>{status}</p>}

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

          <section style={{ marginTop: "40px" }}>
            <h2>Serveurs déjà enregistrés avec un tag</h2>
            {existingServers.length === 0 ? (
              <p>Aucun serveur enregistré.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {existingServers.map((server) => (
                  <li key={server.id} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
                    <p><strong>Nom:</strong> {server.name}</p>
                    <p><strong>ID:</strong> {server.id}</p>
                    <p><strong>Tag:</strong> {server.tag}</p>
                    <p><strong>Vanity URL:</strong> {server.vanity_url || "Aucun"}</p>
                    {server.badge_hash && (
                      <img
                        src={`https://cdn.discordapp.com/clan-badges/${server.id}/${server.badge_hash}.png?size=64`}
                        alt="Badge"
                        width={64}
                        height={64}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </>
  );
}