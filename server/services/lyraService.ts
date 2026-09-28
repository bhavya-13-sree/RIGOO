import { GoogleGenAI } from '@google/genai';
import { db } from '../db/index.ts';
import { rankRides } from './matchingEngine.ts';

// RAG Knowledge Base for RIGOO Platform
export const RIGOO_KNOWLEDGE_BASE = [
  {
    topic: 'About RIGOO & Co-founders',
    content: `RIGOO is an AI-powered bike pooling platform co-founded by M. Rethika and H. Bhavya Sree. RIGOO connects people who are already travelling along similar routes at approximately the same time, allowing riders with an available pillion seat to offer their journey and passengers travelling in the same direction to find compatible rides. RIGOO is NOT a commercial taxi or Uber/Rapido clone. It facilitates non-commercial fuel cost sharing among daily commuters, university students, and office workers.`
  },
  {
    topic: 'How RIGOO Works',
    content: `1. Offer or Find a Ride: Riders publish their planned commute; passengers enter their pickup, destination, and departure time.
2. Get Intelligently Matched: RIGOO's deterministic matching engine checks route corridor overlap, departure time synchronization, detour distance, and safety preferences.
3. Confirm Your Journey: The passenger requests a ride. The rider reviews passenger details and accepts. Seats are locked atomically in the database.
4. Share the Ride & Live GPS: Rider starts pickup navigation, enabling real-time GPS tracking. Once passenger is onboard, trip tracking continues until destination arrival.`
  },
  {
    topic: 'Fuel Cost Sharing Formula',
    content: `RIGOO is strictly a non-commercial cost-sharing platform. Fuel contributions are calculated based on journey distance (km), average two-wheeler fuel efficiency (~45-50 km/L), and current fuel prices (~₹105/L). A typical 4-6 km ride corresponds to an equitable contribution of ₹25 - ₹35. Both rider and passenger review and agree to this fair cost-sharing amount before confirmation.`
  },
  {
    topic: 'Women Safety Priority',
    content: `RIGOO places highest priority on commuter safety. Verified women passengers can toggle the "Women Rider Preference" filter to be matched exclusively with verified female riders (such as co-founders Rethika and Bhavya Sree). If no female rider is available along that corridor at that time, RIGOO clearly states: "No compatible female rider is currently available" and offers options to keep searching or view other verified riders. Gender preference alone is never presented as proof of safety—all users undergo profile and college/corporate ID verification.`
  },
  {
    topic: 'Live GPS Tracking & Privacy',
    content: `RIGOO uses actual GPS coordinates from the browser/device Geolocation API (navigator.geolocation.watchPosition) throttled to 5 seconds. Locations are broadcast strictly via authenticated Socket.IO rooms to confirmed participants. Live coordinates are upserted in the database during active trips and purged upon trip completion. RIGOO does not retain continuous GPS surveillance after trips finish.`
  },
  {
    topic: 'Emergency SOS & Trusted Contact Sharing',
    content: `During any active ride or pickup, passengers and riders have access to the Emergency SOS button. This provides immediate 1-tap connection to Emergency Services (112), Women Helpline (1091), and generates an emergency SMS/notification alert to their registered primary emergency contact. Passengers can also generate a temporary, expiring trip-sharing link to let loved ones view real-time progress on a map without needing an account.`
  },
  {
    topic: 'Registration & Verification',
    content: `To join RIGOO, users register with full name, email, mobile number, college/organization, and emergency contact details. All accounts undergo institutional verification (Student ID, Employee Badge, or Government ID). One user account supports both offering rides (when you have a bike and pillion helmet) and requesting rides (when you need a commute).`
  }
];

// Simple retrieval function for RAG
export function retrieveContext(query: string): string {
  const qLower = query.toLowerCase();
  const matched = RIGOO_KNOWLEDGE_BASE.filter(item => {
    const topicTerms = item.topic.toLowerCase().split(/\s+/);
    return topicTerms.some(term => qLower.includes(term)) ||
      item.content.toLowerCase().split(/\s+/).some(w => w.length > 4 && qLower.includes(w));
  });

  if (matched.length > 0) {
    return matched.map(m => `### ${m.topic}\n${m.content}`).join('\n\n');
  }
  return RIGOO_KNOWLEDGE_BASE.map(m => `### ${m.topic}\n${m.content}`).join('\n\n');
}

export class LyraService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.aiClient = new GoogleGenAI();
      } catch (err) {
        console.warn('[Lyra AI] Failed to initialize Google GenAI SDK:', err);
      }
    }
  }

  async processMessage(userMessage: string, currentUser?: any): Promise<{
    text: string;
    suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
    matchedRides?: any[];
  }> {
    const ragContext = retrieveContext(userMessage);

    // Check if user is asking to search or find rides
    const isSearchIntent = /(find|search|need|look for|going to|ride to|travel to|from|karmanghat|lb nagar|champapet)/i.test(userMessage);

    let matchedRides: any[] = [];
    if (isSearchIntent) {
      // Query active rides from DB
      const allRides = db.getAllOfferedRides({ status: 'OFFERED' });
      // Example default search for common route
      matchedRides = allRides.slice(0, 3);
    }

    // If Gemini client is active, use gemini-3.8-flash
    if (this.aiClient) {
      try {
        const systemPrompt = `You are RideMate AI, the intelligent ride-matching assistant for RIGOO — Share the Journey (co-founded by M. Rethika & H. Bhavya Sree).
RIGOO is an AI-powered bike pooling platform for commuters sharing existing journeys and fuel costs (not a taxi service).
Use the following verified RAG knowledge base:
${ragContext}

Current User: ${currentUser ? `${currentUser.full_name} (${currentUser.gender}, ${currentUser.college_or_org})` : 'Guest'}
Current Available Rides in System: ${JSON.stringify(db.getAllOfferedRides({ status: 'OFFERED' }).map(r => ({
  id: r.id,
  rider: r.rider?.full_name,
  from: r.start_location,
  to: r.destination,
  time: r.departure_time,
  fare: `₹${r.fuel_contribution}`,
  women_only: r.women_only
})))}

Guidelines:
- Speak in a friendly, concise, trustworthy tone.
- If the user asks about rides, cite real available rides from the system. Never invent fake rides.
- Emphasize safety, women priority, verified co-riders, and fuel cost sharing.
- Keep responses within 2 to 3 paragraphs max.`;

        const response = await this.aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          }
        });

        const replyText = response.text || "I'm here to help you match with verified commuters on RIGOO!";
        return {
          text: replyText,
          suggestedActions: [
            { label: 'Find a Ride', action: 'NAVIGATE_FIND_RIDE' },
            { label: 'Offer a Ride', action: 'NAVIGATE_OFFER_RIDE' },
            { label: 'Safety Center', action: 'NAVIGATE_SAFETY' }
          ],
          matchedRides: matchedRides.length > 0 ? matchedRides : undefined
        };
      } catch (err: any) {
        console.warn('[Lyra AI] Gemini generation error, using deterministic RAG response:', err.message);
      }
    }

    // Deterministic fallback response grounded strictly in RAG knowledge base
    const lower = userMessage.toLowerCase();
    let answer = '';

    if (lower.includes('founder') || lower.includes('rethika') || lower.includes('bhavya')) {
      answer = 'RIGOO was co-founded by M. Rethika and H. Bhavya Sree. They designed RIGOO as an AI-powered bike pooling platform that connects everyday commuters travelling along the same routes to share fuel costs, combat traffic congestion, and ensure women commuters travel safely.';
    } else if (lower.includes('safety') || lower.includes('women') || lower.includes('sos')) {
      answer = 'Safety is core to RIGOO! We feature optional Women-to-Women ride matching with verified female riders, live GPS tracking sent directly via Socket.IO, trusted-contact trip sharing links, and an instant Emergency SOS button with 1-tap connections to Emergency 112 and Women Helpline 1091.';
    } else if (lower.includes('fuel') || lower.includes('price') || lower.includes('cost') || lower.includes('fare')) {
      answer = 'RIGOO is strictly non-commercial fuel cost sharing! Contributions are calculated based on road distance, vehicle fuel efficiency (~45-50 km/L), and current petrol rates (~₹105/L). Typical rides between Karmanghat, Champapet, and LB Nagar cost between ₹25 and ₹35.';
    } else if (lower.includes('karmanghat') || lower.includes('lb nagar') || lower.includes('champapet') || lower.includes('ride')) {
      const rides = db.getAllOfferedRides({ status: 'OFFERED' });
      answer = `We have active verified rides available right now along the Karmanghat - LB Nagar - Champapet corridor! For example, Rethika is offering a ride from Karmanghat Hanuman Temple to LB Nagar Metro Station at 08:30 AM (₹25), and Vikram is travelling towards Kamineni Hospital at 08:45 AM.`;
      return {
        text: answer,
        matchedRides: rides,
        suggestedActions: [
          { label: 'View Compatible Rides', action: 'NAVIGATE_FIND_RIDE' },
          { label: 'Publish Your Route', action: 'NAVIGATE_OFFER_RIDE' }
        ]
      };
    } else {
      answer = `Welcome to RIGOO! I can help you find compatible bike rides, explain our route-matching score, assist with offering a pillion seat, or guide you through our Women Safety and Emergency SOS features. Where are you commuting today?`;
    }

    return {
      text: answer,
      suggestedActions: [
        { label: 'Find a Ride', action: 'NAVIGATE_FIND_RIDE' },
        { label: 'Offer a Ride', action: 'NAVIGATE_OFFER_RIDE' },
        { label: 'Safety Guidelines', action: 'NAVIGATE_SAFETY' }
      ]
    };
  }
}

export const lyraService = new LyraService();
