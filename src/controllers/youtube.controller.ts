import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';

interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string }; default: { url: string } };
    publishedAt: string;
  };
}

export async function searchYoutube(req: AuthRequest, res: Response) {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query obrigatória' });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'sua-chave-aqui') {
    return res.status(503).json({ error: 'YOUTUBE_API_KEY não configurada' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q,
        type: 'video',
        maxResults: 10,
        key: apiKey,
        videoCategoryId: '10', // Music category
      },
    });

    const items = (response.data.items as YouTubeItem[]).map((item) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return res.json(items);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error('YouTube API error:', err.response?.data);
      return res.status(502).json({ error: 'Erro ao buscar no YouTube', details: err.response?.data });
    }
    return res.status(500).json({ error: 'Erro interno' });
  }
}
