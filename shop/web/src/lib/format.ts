export const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待支付', className: 'bg-[#f6e5c8] text-[#7a4a12]' },
  paid: { label: '已支付', className: 'bg-[#dce8d2] text-[#36502a]' },
  shipped: { label: '已发货', className: 'bg-[#d8e5ea] text-[#244b58]' },
  completed: { label: '已完成', className: 'bg-[#e5e0d3] text-[#4d4b40]' },
  cancelled: { label: '已取消', className: 'bg-[#eadbd4] text-[#78372a]' },
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function fullAddress(address: { province: string; city: string; district: string; detail: string }): string {
  return `${address.province}${address.city}${address.district}${address.detail}`;
}
