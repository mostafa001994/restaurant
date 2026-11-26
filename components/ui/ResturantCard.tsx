import { Restaurant } from '@/types/models';
import { getImageUrl } from '@/lib/helpers';


interface RestaurantCardProps {
    restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
    return (
        <div className="border p-4 rounded shadow-sm bg-white hover:bg-gray-50 cursor-pointer">
            <img className="w-full h-32 object-cover rounded mb-2" src={getImageUrl(restaurant.cover_image)} alt={restaurant.name} />


            <div className="flex items-center gap-2 mb-2">

                <img className="w-10 h-10 rounded-full object-cover border" src={getImageUrl(restaurant.logo)} alt={restaurant.name} />


                <h2 className="font-semibold text-lg">{restaurant.name}</h2>
            </div>

            <p className="text-sm text-gray-600">{restaurant.address}</p>
        </div>
    );
}