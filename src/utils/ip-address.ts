export function isSharedAddressIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number)

  return (
    octets.length === 4 &&
    octets.every(
      (octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255,
    ) &&
    octets[0] === 100 &&
    octets[1] !== undefined &&
    octets[1] >= 64 &&
    octets[1] <= 127
  )
}
