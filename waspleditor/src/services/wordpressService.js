// wordpressService.js
export async function fetchLatestPosts(limit = 3) {
  const response = await fetch(`https://waspl.wiquid.fr/wp-json/wp/v2/posts?per_page=${limit}&_embed&fields=id,title,link,date,excerpt,featured_media,_links`)
  if (!response.ok) throw new Error("Erreur lors du chargement des articles WordPress")
  return await response.json()
}
