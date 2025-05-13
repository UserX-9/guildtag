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
  const [filterType, setFilterType] = useState("date_desc");
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);


  useEffect(() => {
    fetchExistingServers();
  }, [filterType]);

  const fetchExistingServers = async () => {
    let query = supabase
      .from("discord_tags")
      .select("*")
      .not("tag", "is", null);

    switch (filterType) {
      case "date_asc":
        query = query.order("created_at", { ascending: true });
        break;
      case "date_desc":
        query = query.order("created_at", { ascending: false });
        break;
      case "alpha_asc":
        query = query.order("tag", { ascending: true });
        break;
      case "alpha_desc":
        query = query.order("tag", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading servers");
    } else {
      setExistingServers(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerCode(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setStatus("");

    if (!serverCode.trim()) {
      setError("Please enter a Discord invitation code!");
      return;
    }

    const now = Date.now();
    if (lastSubmitTime && now - lastSubmitTime < 10000) {
      setError("Please wait a few seconds before trying again!");
      return;
    }

    setLastSubmitTime(now);
    setLoading(true);

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
            setStatus("Error checking in the database!");
          } else if (existing) {
            setStatus("This tag is already in the database!");
          } else {
            const { error: insertError } = await supabase.from("discord_tags").insert({
              id: data.guild.id,
              name: data.guild.name,
              tag: tag,
              vanity_url: data.guild.vanity_url_code,
              badge_hash: data.profile.badge_hash,
            });

            if (insertError) {
              console.error(insertError);
              setStatus("Error when adding to database!");
            } else {
              setStatus("Server added to the database!");
              fetchExistingServers();
            }
          }
        } else {
          setStatus("This server has no tag!");
        }
      } else {
        throw new Error("Server not found or invitation code invalid!");
      }
    } catch (err: any) {
      setError(err.message || "An error has occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Guildtag</title>
        <meta name="description" content="Our platform allows you to search, check and explore Discord servers with an official’ tag. Easily add a server with its’invitation code, check its information, and join a community with one click." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:title" content="Guildtag" />
        <meta property="og:image" content="https://bnhzdyuoynsyxjdvvnmt.supabase.co/storage/v1/object/public/assets//favicon.ico" />
        <meta name="og:description" content="Our platform allows you to search, check and explore Discord servers with an official’ tag. Easily add a server with its’invitation code, check its information, and join a community with one click." />
      
        <link rel="icon" href="https://bnhzdyuoynsyxjdvvnmt.supabase.co/storage/v1/object/public/assets/favicon.ico" />
        <link rel="apple-touch-icon" href="https://bnhzdyuoynsyxjdvvnmt.supabase.co/storage/v1/object/public/assets/favicon.ico" />
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Servers tags</h1>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={serverCode}
              onChange={handleInputChange}
              placeholder="Enter a Discord server code"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Verify"}
            </button>
          </form>

          {error && (
            <p className="error">
              <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.4801 1.26993L1.51992 12.2301M12.4801 12.2301L8.41421 8.16422M1.51992 1.26993L5.58579 5.3358" stroke="#FF0000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {error}
            </p>
          )}
          {status && (
            <p className="success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.70134 2.79306C9.07138 3.55854 8.10171 3.96019 7.11499 3.86436C5.24979 3.68322 3.68316 5.24985 3.8643 7.11505C3.96013 8.10177 3.55847 9.07144 2.793 9.7014C1.34602 10.8922 1.34602 13.1078 2.793 14.2986C3.55847 14.9285 3.96013 15.8982 3.8643 16.8849C3.68316 18.7501 5.24979 20.3168 7.11499 20.1356C8.10171 20.0398 9.07138 20.4414 9.70134 21.2069C10.8921 22.6539 13.1077 22.6539 14.2985 21.2069C14.9285 20.4414 15.8981 20.0398 16.8849 20.1356C18.7501 20.3168 20.3167 18.7501 20.1355 16.8849C20.0397 15.8982 20.4414 14.9285 21.2068 14.2986C22.6538 13.1078 22.6538 10.8922 21.2068 9.7014C20.4414 9.07144 20.0397 8.10177 20.1355 7.11505C20.3167 5.24985 18.7501 3.68322 16.8849 3.86436C15.8981 3.96019 14.9285 3.55854 14.2985 2.79306C13.1077 1.34608 10.8921 1.34608 9.70134 2.79306Z" fill="#4BCE97" stroke="#4BCE97"/>
                <g filter="url(#filter0_d_116_750)">
                <path d="M8 11.5L11 14.5L16.5 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <defs>
                <filter id="filter0_d_116_750" x="5" y="6" width="14.5" height="11.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset/>
                <feGaussianBlur stdDeviation="1"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.338437 0 0 0 0 0.483482 0 0 0 0.4 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_116_750"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_116_750" result="shape"/>
                </filter>
                </defs>
              </svg>
              {status}
            </p>
          )}

          {serverData && (
            <div className="server-info">

              <h2>{serverData.name}</h2>
              <p><strong>Server ID:</strong> {serverData.id}</p>
              <p><strong>Number of members:</strong> {profileData?.member_count || "N/A"}</p>
              <p><strong>Code Vanity URL:</strong> {serverData.vanity_url_code || "Aucun"}</p>

              <div className="tag" style={{marginTop: 5}}>
                {profileData?.tag && (
                  <img
                    src={`https://cdn.discordapp.com/clan-badges/${serverData.id}/${profileData?.badge_hash}.png?size=64`}
                    alt="Badge"
                  />
                )}
                <p>{profileData?.tag || "None"}</p>
              </div>
            </div>
          )}

          <section style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="info">All time</p>
            </div>
            <h2>Public servers with tags.</h2>
            <div className="filter-guild">
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <div
                  onClick={() => setFilterType("date_desc")}
                  className={filterType === "date_desc" ? "filter-active" : "filter"}
                >
                  More recent
                </div>
                <div
                  onClick={() => setFilterType("date_asc")}
                  className={filterType === "date_asc" ? "filter-active" : "filter"}
                >
                  Older one
                </div>
                <div
                  onClick={() => setFilterType("alpha_asc")}
                  className={filterType === "alpha_asc" ? "filter-active" : "filter"}
                >
                  A-Z
                </div>
                <div
                  onClick={() => setFilterType("alpha_desc")}
                  className={filterType === "alpha_desc" ? "filter-active" : "filter"}
                >
                  Z-A
                </div>
              </div>
            </div>
            {existingServers.length === 0 ? (
              <p>No server registered.</p>
            ) : (
              <ul>
                {existingServers.map((server) => (
                  <li key={server.id}>
                    <div className="container-guild">
                      {server.badge_hash && (
                        <img
                          src={`https://cdn.discordapp.com/clan-badges/${server.id}/${server.badge_hash}.png?size=64`}
                          alt="Badge"
                        />
                      )}
                      <div>
                        <p><strong>{server.tag}</strong></p>
                        <div className="tag">
                          {server.badge_hash && (
                            <img
                              src={`https://cdn.discordapp.com/clan-badges/${server.id}/${server.badge_hash}.png?size=64`}
                              alt="Badge"
                            />
                          )}
                          <p>{server.tag}</p>
                        </div>
                      </div>
                    </div>
                    <div className="container-guild-info">
                      {server.vanity_url && (
                        <a className="joinButton" href={`https://discord.gg/${server.vanity_url}`} target="_blank">join</a>
                      )}
                      <p>
                        <strong>
                          {server.vanity_url ? `.gg/${server.vanity_url}` : "No vanity for this server"}
                        </strong>
                      </p>
                      <p>{server.id}</p>
                    </div>
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