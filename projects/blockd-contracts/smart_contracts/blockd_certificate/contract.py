from algopy import ARC4Contract, String, UInt64, arc4, BoxMap, itxn, Global, Txn

class BlockdCertificate(ARC4Contract):
    def __init__(self) -> None:
        self.total_certificates = UInt64(0)
        self.certificates = BoxMap(String, UInt64)
        self.version = String("2.0.0")
        self.issuer = arc4.Address(Global.creator_address)

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self) -> None:
        pass

    @arc4.abimethod
    def issue_certificate(
        self,
        scan_id: String,
        ipfs_url: String
    ) -> UInt64:
        """Mint a Certificate NFT and record it on-chain."""
        # Access control: certificates represent an attestation and must be issuer-controlled
        assert arc4.Address(Txn.sender) == self.issuer, "Only issuer can issue certificates"
        assert scan_id, "scan_id required"
        assert ipfs_url, "ipfs_url required"
        assert scan_id not in self.certificates, "Certificate already issued for scan"

        # Note: MBR for the box and the asset must be covered by the caller
        asset_mint = itxn.AssetConfig(
            asset_name=String("BlockD Certificate"),
            unit_name=String("BLKD"),
            total=1,
            decimals=0,
            default_frozen=False,
            url=ipfs_url,
        ).submit()

        created_asset_id = asset_mint.created_asset.id

        # Map the scan_id to the created asset id
        self.certificates[scan_id] = created_asset_id
        self.total_certificates += 1
        
        return created_asset_id

    @arc4.abimethod(readonly=True)
    def get_certificate_asset(self, scan_id: String) -> UInt64:
        """Retrieve the minted Asset ID for a scan."""
        assert scan_id in self.certificates, "Certificate not found"
        return self.certificates[scan_id]

    @arc4.abimethod(readonly=True)
    def get_total_certificates(self) -> UInt64:
        """Read total number of certificates issued."""
        return self.total_certificates
