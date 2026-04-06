import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const generateTestData = (size: number) => {
  return new Uint8Array(size).fill(0);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const testType = url.searchParams.get('type');

    if (testType === 'download') {
      // Generate 10MB of test data
      const testData = generateTestData(10 * 1024 * 1024);
      
      return new Response(testData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Length': testData.length.toString(),
        },
      });
    } else if (testType === 'upload') {
      const data = await req.arrayBuffer();
      
      return new Response(JSON.stringify({ 
        size: data.byteLength,
        received: true 
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid test type' }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});