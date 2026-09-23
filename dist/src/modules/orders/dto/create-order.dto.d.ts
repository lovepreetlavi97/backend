export declare class OrderItemDto {
    productId: string;
    quantity: number;
}
export declare class ShippingAddressDto {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
}
export declare class CreateOrderDto {
    userId: string;
    items: OrderItemDto[];
    shippingAddress: ShippingAddressDto;
}
