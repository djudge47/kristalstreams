import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Channel {
  id: number;
  category: string;
}

const showData: Record<string, { shows: string[], times: string[] }> = {
  Sports: {
    shows: [
      'NFL Sunday Night Football', 'NBA Game Time', 'Premier League Match', 'Champions League Live',
      'MLB Tonight', 'College Football', 'UFC Fight Night', 'Boxing Championship',
      'Tennis Masters', 'Golf Tournament', 'Formula 1 Racing', 'NHL Hockey Night'
    ],
    times: ['14:00 - 17:00', '18:00 - 21:00', '19:00 - 22:00', '20:00 - 23:00', '21:00 - 00:00']
  },
  Movies: {
    shows: [
      'The Batman (2022)', 'Top Gun: Maverick (2022)', 'Oppenheimer (2023)', 'Barbie (2023)',
      'Dune (2021)', 'Spider-Man: No Way Home', 'Avatar: The Way of Water', 'Everything Everywhere All at Once',
      'The Godfather (1972)', 'Inception (2010)', 'Interstellar (2014)', 'The Dark Knight (2008)',
      'Pulp Fiction (1994)', 'Forrest Gump (1994)', 'The Matrix (1999)', 'Titanic (1997)'
    ],
    times: ['18:00 - 20:30', '19:00 - 21:30', '20:00 - 22:30', '21:00 - 23:30', '22:00 - 00:30']
  },
  News: {
    shows: [
      'World News Tonight', 'Breaking News Special', 'Business Report', 'Political Roundtable',
      'Global Markets Update', 'The News Hour', 'Evening Report', 'Prime Time News',
      'Financial News', 'World Affairs', 'News Analysis', 'Late Night News'
    ],
    times: ['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00']
  },
  Entertainment: {
    shows: [
      'Stranger Things S04E09', 'The Last of Us S01E09', 'House of the Dragon S01E10', 'The Boys S04E08',
      'Succession S04E10', 'The Mandalorian S03E08', 'Ted Lasso S03E12', 'The Bear S02E10',
      'Wednesday S01E08', 'The Crown S06E10', 'Yellowstone S05E14', 'Better Call Saul S06E13'
    ],
    times: ['19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 00:00']
  },
  Kids: {
    shows: [
      'SpongeBob SquarePants', 'PAW Patrol', 'Bluey', 'Mickey Mouse Clubhouse',
      'Peppa Pig', 'Sesame Street', 'Teen Titans Go!', 'Adventure Time',
      'The Owl House', 'Amphibia', 'Scooby-Doo', 'Wild Kratts'
    ],
    times: ['08:00 - 08:30', '09:00 - 09:30', '14:00 - 14:30', '15:00 - 15:30', '16:00 - 16:30']
  },
  Documentary: {
    shows: [
      'Planet Earth III', 'Blue Planet II', 'Our Planet', 'Life on Earth',
      'Ancient Aliens', 'How the Universe Works', 'Secrets of the Whales', 'Frozen Planet',
      'Hostile Planet', 'North Woods Law', 'Air Disasters', 'NASA Unexplained Files'
    ],
    times: ['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00']
  },
  Music: {
    shows: [
      'Top 40 Video Countdown', 'MTV Unplugged', '80s Rock Hits', '90s Pop Marathon',
      'Hip Hop Video Mix', 'Country Music Hour', 'EDM Festival Live', 'Live Concert Series',
      'Classic Rock Videos', 'R&B Soul Night', 'Jazz Essentials', 'New Music Friday'
    ],
    times: ['16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00', '22:00 - 00:00', '00:00 - 02:00']
  },
  International: {
    shows: [
      'International News', 'World Cinema', 'Global Entertainment', 'Cultural Hour',
      'Foreign Drama Series', 'International Sports', 'World News Report', 'Evening Bulletin'
    ],
    times: ['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00']
  }
};

const show247Data: Record<string, { shows: string[] }> = {
  '24/7 Comedy': {
    shows: ['The Office', 'Friends', 'Parks and Recreation', 'Brooklyn Nine-Nine', 'Seinfeld', 'Two and a Half Men', 'How I Met Your Mother', 'Big Bang Theory', 'Modern Family', 'Scrubs']
  },
  '24/7 Drama': {
    shows: ['Breaking Bad', 'Game of Thrones', 'The Sopranos', 'The Wire', 'Mad Men']
  },
  '24/7 Action': {
    shows: ['Hawaii Five-0', 'Strike Back', '24', 'NCIS', 'CSI']
  },
  '24/7 Crime': {
    shows: ['Law & Order SVU', 'Criminal Minds', 'Bones']
  },
  '24/7 Sci-Fi': {
    shows: ['The X-Files', 'Star Trek TNG', 'Star Trek DS9', 'Stargate SG-1', 'Doctor Who']
  },
  '24/7 Animation': {
    shows: ['Futurama', 'South Park', 'Rick and Morty', 'Family Guy', 'American Dad', 'The Simpsons', 'SpongeBob', 'Adventure Time', 'Regular Show']
  },
  '24/7 Horror': {
    shows: ['Supernatural', 'The Walking Dead', 'American Horror Story']
  }
};

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomEpisode(showName: string): string {
  const season = Math.floor(Math.random() * 10) + 1;
  const episode = Math.floor(Math.random() * 20) + 1;
  return `${showName} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}

function getShowDataForCategory(category: string) {
  if (category.startsWith('24/7')) {
    const categoryData = show247Data[category];
    if (categoryData) {
      const show = getRandomItem(categoryData.shows);
      return {
        currentShow: getRandomEpisode(show),
        nextShow: getRandomEpisode(show),
        currentShowTime: '00:00 - 00:30',
        nextShowTime: '00:30 - 01:00'
      };
    }
  }

  const baseCategory = Object.keys(showData).find(key => 
    category.toLowerCase().includes(key.toLowerCase())
  ) || 'Entertainment';
  
  const categoryData = showData[baseCategory];
  const shows = categoryData.shows;
  const times = categoryData.times;
  
  const currentShow = getRandomItem(shows);
  let nextShow = getRandomItem(shows);
  while (nextShow === currentShow && shows.length > 1) {
    nextShow = getRandomItem(shows);
  }
  
  const currentTime = getRandomItem(times);
  const nextTime = getRandomItem(times);
  
  return {
    currentShow,
    nextShow,
    currentShowTime: currentTime,
    nextShowTime: nextTime
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: channels, error: fetchError } = await supabase
      .from('channels')
      .select('id, category')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    const updates = channels.map((channel: Channel) => {
      const epgData = getShowDataForCategory(channel.category);
      return {
        id: channel.id,
        ...epgData,
        updated_at: new Date().toISOString()
      };
    });

    for (const update of updates) {
      await supabase
        .from('channels')
        .update({
          current_show: update.currentShow,
          next_show: update.nextShow,
          current_show_time: update.currentShowTime,
          next_show_time: update.nextShowTime,
          updated_at: update.updated_at
        })
        .eq('id', update.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated EPG data for ${channels.length} channels`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});