import { createFileRoute, notFound } from "@tanstack/react-router";
import { getUserByUsername } from "../server/users";
import { getUsdcBalance } from "../server/wallet";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/user/$username")({
  loader: async ({ params }) => {
    const user = await getUserByUsername({
      data: { username: params.username },
    });
    if (!user) {
      throw notFound();
    }
    return { user };
  },
  component: UserProfile,
});

function UserProfile() {
  const { user: profileUser } = Route.useLoaderData();
  const { user: authenticatedUser } = usePrivy();
  const { exportWallet } = useExportWallet();

  // Check if viewing own profile
  const isOwner = authenticatedUser?.id === profileUser.id;
  const walletAddress = authenticatedUser?.wallet?.address;

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["balance", walletAddress],
    queryFn: () => getUsdcBalance({ data: { address: walletAddress ?? "" } }),
    enabled: !!isOwner && !!walletAddress,
  });

  return (
    <div className="px-2 py-2 max-w-4xl">
      <table
        className="text-[10pt] text-black border-collapse"
        style={{ borderSpacing: 0 }}
      >
        <tbody>
          <tr className="h-6">
            <td className="align-top text-[#828282] w-24 pr-2">user:</td>
            <td className="align-top font-bold text-[#3c963c]">
              {profileUser.username || profileUser.id.slice(0, 8)}
            </td>
          </tr>
          <tr className="h-6">
            <td className="align-top text-[#828282] w-24 pr-2">created:</td>
            <td className="align-top">
              {new Date(profileUser.createdAt).toLocaleDateString()}
            </td>
          </tr>
          <tr className="h-6">
            <td className="align-top text-[#828282] w-24 pr-2">status:</td>
            <td className="align-top capitalize">{profileUser.stage}</td>
          </tr>
          <tr className="h-6">
            <td className="align-top text-[#828282] w-24 pr-2">karma:</td>
            <td className="align-top">{profileUser.karma}</td>
          </tr>
          {isOwner && (
            <tr className="h-6">
              <td className="align-top text-[#828282] w-24 pr-2">email:</td>
              <td className="align-top">{profileUser.email}</td>
            </tr>
          )}
          {isOwner && walletAddress && (
            <>
              <tr className="h-6">
                <td className="align-top text-[#828282] w-24 pr-2">balance:</td>
                <td className="align-top">
                  {isLoadingBalance
                    ? "loading..."
                    : `$${balanceData?.balance?.toFixed(2) ?? "..."} USDC`}
                </td>
              </tr>
              <tr className="h-6">
                <td className="align-top text-[#828282] w-24 pr-2">wallet:</td>
                <td className="font-mono text-xs break-all">
                  {walletAddress}{" "}
                  <span
                    onClick={() => exportWallet({ address: walletAddress })}
                    className="text-[10px] text-[#828282] cursor-pointer hover:underline"
                  >
                    export
                  </span>
                </td>
              </tr>
              <tr>
                <td className="align-top text-[#828282] w-24 pr-2">qr:</td>
                <td className="align-top pt-2">
                  <div className="p-1 bg-white border border-gray-200 inline-block">
                    <QRCodeSVG value={walletAddress} size={100} />
                  </div>
                </td>
              </tr>
            </>
          )}
          <tr className="h-6">
            <td className="align-top text-[#828282] w-24 pr-2"></td>
            <td className="align-top pt-4">
              <a href="#" className="underline text-black mr-2">
                submissions
              </a>
              <a href="#" className="underline text-black mr-2">
                comments
              </a>
              <a href="#" className="underline text-black">
                favorites
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
