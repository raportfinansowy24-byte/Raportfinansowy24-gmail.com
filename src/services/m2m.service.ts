export interface M2MOffer {
  id?: string;
  campaignId?: string;
  offererName?: string;
  offerName?: string;
  apr?: number;
  provisionValue?: number;
  epc?: number;
  approvalRate?: number;
  monthlyPayment?: number;
  url?: string;
  link?: string;
  status?: string;
  name?: string;
  features?: string[];
  category?: string;
  params?: Record<string, string>;
  comment?: string;
}

export class M2mService {
  private readonly PARTNER_ID = '388900';
  private readonly MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/ywq8k4s6gyaj0sv9b9ci603l1uvzdnnc';

  async getAllOffers(categories: string[]): Promise<M2MOffer[]> {
    try {
      const response = await fetch(this.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'getAllOffers',
          categories,
          all_offers: true
        })
      });

      if (response.ok) {
        const text = await response.text();
        if (text === 'Accepted') {
          console.warn('Webhook returned "Accepted" instead of JSON.');
          return [];
        }
        const data = JSON.parse(text);
        if (data.offers && Array.isArray(data.offers)) {
          return data.offers;
        }
      }
      return [];
    } catch (error) {
      console.error('Błąd pobierania listy ofert z Make.com:', error);
      return [];
    }
  }  async getBestOffer(
    amount: number, 
    term: number, 
    months: number,
    categories?: string[], 
    incomeType?: string,
    ageGroup?: string,
    excludedBanks?: string[],
    debtAmount?: number,
    creditCardLimit?: number
  ): Promise<M2MOffer | null> {
    try {
      const response = await fetch(this.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'getBestOffer',
          amount, 
          term,
          months,
          categories, 
          income_type: incomeType,
          age_group: ageGroup,
          excluded_banks: excludedBanks,
          debt_amount: debtAmount,
          credit_card_limit: creditCardLimit
        })
      });

      if (response.ok) {
        const text = await response.text();
        if (text === 'Accepted') {
          console.warn('Webhook returned "Accepted" instead of JSON.');
          return null;
        }
        const data = JSON.parse(text);
        
        if (data.status === 'downsell') {
          return data;
        }

        if (data.offerDetails) {
          return {
            ...data.offerDetails,
            url: data.url
          };
        }
      }
      
      console.warn('Webhook nie zwrócił poprawnego JSONa.');
      return null;

    } catch (error) {
      console.error('Błąd połączenia z Make.com:', error);
      return null;
    }
  }

  async getLoanOffers(amount: number, term: number, interestRate: number): Promise<any> {
    try {
      const response = await fetch(this.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kwota: amount,
          okres: term,
          oprocentowanie: interestRate
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('System odrzucił zapytanie:', errorText);
        throw new Error('System odrzucił zapytanie.');
      }

      const text = await response.text();
      console.log('Odpowiedź z Make.com:', text);
      
      if (text.trim() === 'Accepted') {
        console.warn('Webhook returned "Accepted" instead of JSON.');
        return null;
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Błąd w getLoanOffers:', error);
      throw error;
    }
  }
}

export const m2mService = new M2mService();