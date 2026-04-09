import type { PlaidItem, User } from "@finapse/types";

const DASHBOARD_MESSAGES = {
    timeOfDay: {
      morning: [
        { greeting: "Morning, {name}.", saying: "Here's where things stand." },
        { greeting: "Early start.", saying: "Let's see where your money's at." },
        { greeting: "Good morning.", saying: "Your finances are ready when you are." },
        { greeting: "Morning.", saying: "A few numbers to kick off your day." },
        { greeting: "Rise and check.", saying: "Here's your financial snapshot." },
        { greeting: "Good morning.", saying: "Nothing urgent, just your usual overview." },
        { greeting: "Morning.", saying: "Let's make today a good financial day." },
      ],
      afternoon: [
        { greeting: "Good afternoon.", saying: "A few things to catch up on." },
        { greeting: "Midday check-in.", saying: "Here's where you stand." },
        { greeting: "Afternoon.", saying: "Your money's been busy — here's the recap." },
        { greeting: "Good afternoon.", saying: "Nothing alarming, just worth a look." },
        { greeting: "Taking a break?", saying: "Here's a quick financial check-in." },
        { greeting: "Afternoon.", saying: "Let's see how the month's shaping up." },
        { greeting: "Good afternoon, {name}.", saying: "Here's the latest." },
      ],
      evening: [
        { greeting: "Evening, {name}.", saying: "Here's your day in numbers." },
        { greeting: "Good evening.", saying: "Here's what happened with your money today." },
        { greeting: "End of day.", saying: "Here's the financial recap." },
        { greeting: "Evening.", saying: "Not a bad day — here's the breakdown." },
        { greeting: "Good evening.", saying: "Let's close out the day with a quick look." },
        { greeting: "Winding down?", saying: "Here's where your finances are at." },
        { greeting: "Evening.", saying: "A few things worth noting from today." },
      ],
      late_night: [
        { greeting: "Still up?", saying: "Here's a quick look at your finances." },
        { greeting: "Burning the midnight oil.", saying: "Here's your financial snapshot." },
        { greeting: "Late night check-in.", saying: "Everything's looking fine." },
        { greeting: "Can't sleep?", saying: "At least your finances are in order." },
        { greeting: "Night owl mode.", saying: "Here's where things stand." },
        { greeting: "It's late.", saying: "But your money never sleeps — here's the overview." },
        { greeting: "Still here?", saying: "Let's take a quick look at the numbers." },
      ],
    },
  
    dataObservations: [
      { greeting: "Quiet week.", saying: "Only a handful of transactions since Monday — nothing unusual to flag." },
      { greeting: "Heads up, {name}.", saying: "Your top spending category this month is {topCategory} at ${topAmount}." },
      { greeting: "Looking good.", saying: "You're on track to spend less this month than last." },
      { greeting: "Worth noting.", saying: "You've made {txCount} transactions this week." },
      { greeting: "Nice work, {name}.", saying: "Net worth up ${netWorthDelta} since you started using Finapse." },
      { greeting: "Something to watch.", saying: "Spending is running a bit higher than your monthly average." },
      { greeting: "All clear.", saying: "No unusual charges detected this week." },
    ],
  
    periodBoundary: {
        endOfMonth: [
          { greeting: "{daysLeft} days left.", saying: "Month's almost up — here's where your budget stands." },
          { greeting: "Almost there.", saying: "Month's wrapping up — here's where your budget stands." },
          { greeting: "End of month incoming.", saying: "A good time to check in before the reset." },
        ],
        startOfMonth: [
          { greeting: "Fresh start.", saying: "New month, clean slate — here's your opening balance." },
          { greeting: "New month.", saying: "Last month's behind you — let's see how this one goes." },
          { greeting: "New month.", saying: "Your budgets have reset and you're ready to go." },
        ],
      },
  
    urgentAlerts: {
      reauthRequired: {
        greeting: "Action needed.",
        saying: "One of your accounts needs to be reconnected — some data may be missing.",
      },
      highCreditUtilization: {
        greeting: "Heads up.",
        saying: "Your credit utilization is getting high — worth paying down before the statement closes.",
      },
    },
  } as const

// Maybe a random super rare setting
// Fun ones like a lot spent on groceries ect 

const GRETTING_KEY = 'finapse_greeting';
const GREETING_TTL_MS = 1; //10 * 60 * 1000;
const ROLL_THRESHOLD = 0.10;

interface CachedGretting {
    greeting: string,
    saying: string,
    cachedAt: number,
}

interface Greeting {
    greeting: string,
    saying: string,
}

interface GreetingContext {
    name: string;
    daysLeft: number;
    dayOfMonth: number;
  }
  

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late_night'


export function getDashboardGreeting(
    items: PlaidItem[],
    //accounts: Account[],
    user: User,
): Greeting{

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const ctx: GreetingContext = {
        name: user.fullName,
        daysLeft,
        dayOfMonth,
    };

    const urgent: Greeting | null = getUrgent(items);
    if(urgent) return applyTokens(urgent, ctx);

    const boundry: Greeting | null = getPeriodBoundry(ctx);
    if(boundry) return applyTokens(boundry, ctx);

    const observation: Greeting | null = getObservation();
    if (observation) return applyTokens(observation, ctx);

    // Pick random ToD message
    const message: Greeting = pickRandom();
    return applyTokens(message, ctx);

}


function getUrgent(items: PlaidItem[]): Greeting | null {
    const needsReauth = items.some(item => item.status === 'NEEDS_REAUTH');
    if (needsReauth) return DASHBOARD_MESSAGES.urgentAlerts.reauthRequired;
    return null;
}

function getPeriodBoundry(ctx: GreetingContext): Greeting | null {
    const { daysLeft, dayOfMonth } = ctx;
    const bucket = DASHBOARD_MESSAGES.periodBoundary;

    if (daysLeft <= 4) {
        const messages = bucket.endOfMonth;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    if (dayOfMonth < 2) {
        const messages = bucket.startOfMonth;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    return null;
}


function getObservation(): Greeting | null{
    const didRoll: boolean =  Math.random() < ROLL_THRESHOLD

    if(!didRoll) return null;

    const safe = DASHBOARD_MESSAGES.dataObservations.filter(
        m => !m.saying.match(/\{(?!name|daysLeft)[^}]+\}/)
    );

    return safe[Math.floor(Math.random() * safe.length)];
}

function timeOfDay(): TimeOfDay{
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'late_night'
}

function pickRandom(): Greeting{
    const time: TimeOfDay = timeOfDay();

    const bucket = DASHBOARD_MESSAGES.timeOfDay[time];
    return bucket[Math.floor(Math.random() * bucket.length)];
}

function applyTokens(greeting: Greeting, ctx: GreetingContext): Greeting {
    const replace = (str: string) =>
        str
            .replace(/{name}/g, ctx.name)
            .replace(/{daysLeft}/g, String(ctx.daysLeft));

    return {
        greeting: replace(greeting.greeting),
        saying: replace(greeting.saying),
    };
}




export function setCachedGreeting(greeting: string, saying: string): void {
    const payload: CachedGretting = {greeting, saying, cachedAt: Date.now()};
    sessionStorage.setItem(GRETTING_KEY, JSON.stringify(payload));
}

export function getCachedGreeting(): CachedGretting | null{
    try{
        const raw = sessionStorage.getItem(GRETTING_KEY);
        if(!raw) return null;

        const cached: CachedGretting = JSON.parse(raw);
        const age = Date.now() - cached.cachedAt;

        if (age > GREETING_TTL_MS){
            sessionStorage.removeItem(GRETTING_KEY);
            return null;
        }

        return cached
    }catch{
        return null;
    }
}

