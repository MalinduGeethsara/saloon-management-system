import { getAllPublicBarbers, getAllPublicServices, getPublicShops, getPublicProducts } from "@/lib/actions/public";
import { getBookingContact } from "@/lib/actions/booking";
import BookingClient from "./BookingClient";

// Depends on who is signed in (their saved mobile number), so it is rendered per request
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  // All the data the wizard needs, fetched in parallel on the server and sent with the page. (Loading it
  // from the browser meant five server calls that the browser runs one after another.)
  const [barbers, services, shops, products, contact] = await Promise.all([
    getAllPublicBarbers(),
    getAllPublicServices(),
    getPublicShops(),
    getPublicProducts(),
    getBookingContact(),
  ]);

  return <BookingClient initial={{ barbers, services, shops, products, contact }} />;
}
