import { NextRequest, NextResponse } from 'next/server';

// Types for the geocoding response
interface GeocodeResult {
  address: string;
  lat: number | null;
  lon: number | null;
  display_name?: string;
  error?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NextJS-Geocoder-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NominatimResponse[] = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        address,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name
      };
    } else {
      return {
        address,
        lat: null,
        lon: null,
        error: 'Address not found'
      };
    }
  } catch (error) {
    return {
      address,
      lat: null,
      lon: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses } = body;

    if (!addresses) {
      return NextResponse.json(
        { error: 'Missing addresses field in request body' },
        { status: 400 }
      );
    }

    const addressList = Array.isArray(addresses) ? addresses : [addresses];
    
    if (addressList.length === 0) {
      return NextResponse.json(
        { error: 'No addresses provided' },
        { status: 400 }
      );
    }

    const invalidAddresses = addressList.filter(addr => typeof addr !== 'string' || addr.trim().length === 0);
    if (invalidAddresses.length > 0) {
      return NextResponse.json(
        { error: 'All addresses must be non-empty strings' },
        { status: 400 }
      );
    }

    // limit rate
    const results: GeocodeResult[] = [];
    for (let i = 0; i < addressList.length; i++) {
      const result = await geocodeAddress(addressList[i]);
      results.push(result);
      
      if (i < addressList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to process geocoding request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty address query parameter' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to process geocoding request' },
      { status: 500 }
    );
  }
}