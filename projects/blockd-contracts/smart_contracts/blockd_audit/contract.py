from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    String,
    Txn,
    UInt64,
    arc4,
    gtxn,
    TransactionType
)

class AuditRecord(arc4.Struct):
    owner: arc4.Address
    url_hash: arc4.String
    risk_score: arc4.UInt64
    ipfs_cid: arc4.String
    timestamp: arc4.UInt64
    vouch_count: arc4.UInt64

class UserProfile(arc4.Struct):
    username: arc4.String
    is_working: arc4.UInt64 # 0=Free, 1=Working
    joined_at: arc4.UInt64

class BlockdAudit(ARC4Contract):
    def __init__(self) -> None:
        self.total_audits = UInt64(0)
        self.audits = BoxMap(String, AuditRecord)
        self.manager = arc4.Address(Global.creator_address)
        self.user_status = BoxMap(arc4.Address, arc4.UInt64) # Legacy status map
        self.profiles = BoxMap(arc4.Address, UserProfile)
        self.experts = BoxMap(arc4.Address, arc4.UInt64) # 1 = Verified Expert
        self.version = String("6.0.0")

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self) -> None:
        pass

    @arc4.abimethod
    def set_expert(self, expert: arc4.Address, is_expert: arc4.UInt64) -> None:
        """Assign or revoke Expert status (Manager only)."""
        assert arc4.Address(Txn.sender) == self.manager, "Only manager can assign experts"
        self.experts[expert] = is_expert

    @arc4.abimethod(readonly=True)
    def is_expert(self, expert: arc4.Address) -> arc4.UInt64:
        """Check if an address is a verified expert."""
        if expert in self.experts:
            return self.experts[expert]
        return arc4.UInt64(0)

    @arc4.abimethod
    def vouch_for_audit(self, scan_id: String) -> None:
        """Expert adds their signature to an existing audit."""
        assert self.is_expert(arc4.Address(Txn.sender)) == arc4.UInt64(1), "Only verified experts can vouch"
        assert scan_id in self.audits, "Audit not found"
        
        current = self.audits[scan_id].copy()
        new_vouch_count = current.vouch_count.native + UInt64(1)
        self.audits[scan_id] = AuditRecord(
            owner=current.owner,
            url_hash=current.url_hash,
            risk_score=current.risk_score,
            ipfs_cid=current.ipfs_cid,
            timestamp=current.timestamp,
            vouch_count=arc4.UInt64(new_vouch_count)
        )

    @arc4.abimethod
    def anchor_audit(
        self,
        scan_id: String,
        owner: arc4.Address,
        url_hash: arc4.String,
        risk_score: arc4.UInt64,
        ipfs_cid: arc4.String,
    ) -> None:
        """Anchor a privacy audit on-chain. If owner is Working, charge 1 ALGO."""
        # Integrity: the caller must be the claimed owner (prevents forging audits for others)
        assert owner == arc4.Address(Txn.sender), "Owner must match sender"
        # Prevent overwriting an existing audit
        assert scan_id not in self.audits, "Audit already exists"

        # Cost check: If user is working (status 1), we enforce 1 ALGO payment to contract
        user_status = self.get_user_status(owner)
        if user_status == arc4.UInt64(1):
            # Enforce 1 ALGO payment in the same group
            # [Txn 0: Payment, Txn 1: App Call]
            assert Global.group_size == UInt64(2), "Working users must pay 1 ALGO fee"
            assert Txn.group_index == UInt64(1), "App call must be second in group"
            fee_txn = gtxn.PaymentTransaction(0)
            assert fee_txn.sender == Txn.sender, "Fee must be paid by sender"
            assert fee_txn.receiver == Global.current_application_address, "Fee must go to app"
            assert fee_txn.amount >= UInt64(1_000_000), "Fee must be at least 1 ALGO"

        self.audits[scan_id] = AuditRecord(
            owner=owner,
            url_hash=url_hash,
            risk_score=risk_score,
            ipfs_cid=ipfs_cid,
            timestamp=arc4.UInt64(Global.latest_timestamp),
            vouch_count=arc4.UInt64(0)
        )
        self.total_audits += 1

    @arc4.abimethod
    def set_user_status(self, user: arc4.Address, status: arc4.UInt64) -> None:
        """Update a user's employment status (Manager only)."""
        assert arc4.Address(Txn.sender) == self.manager, "Only manager can update user status"
        self.user_status[user] = status
        
        # Also update the profile if it exists
        if user in self.profiles:
            current = self.profiles[user].copy()
            self.profiles[user] = UserProfile(
                username=current.username,
                is_working=status,
                joined_at=current.joined_at
            )

    @arc4.abimethod(readonly=True)
    def get_user_status(self, user: arc4.Address) -> arc4.UInt64:
        """Read a user's employment status."""
        if user in self.user_status:
            return self.user_status[user]
        return arc4.UInt64(0) # Default to Job-seeker/Free

    @arc4.abimethod
    def set_profile(self, username: arc4.String) -> None:
        """Set or update user profile on-chain. Caller is owner."""
        sender = arc4.Address(Txn.sender)
        status = self.get_user_status(sender)
        
        joined = arc4.UInt64(Global.latest_timestamp)
        if sender in self.profiles:
            joined = self.profiles[sender].joined_at
            
        self.profiles[sender] = UserProfile(
            username=username,
            is_working=status,
            joined_at=joined
        )

    @arc4.abimethod(readonly=True)
    def get_profile(self, user: arc4.Address) -> UserProfile:
        """Retrieve the on-chain user profile."""
        assert user in self.profiles, "Profile not found"
        return self.profiles[user]

    @arc4.abimethod(readonly=True)
    def get_total_audits(self) -> UInt64:
        """Read total number of audits anchored."""
        return self.total_audits

    @arc4.abimethod(readonly=True)
    def get_audit(self, scan_id: String) -> AuditRecord:
        """Retrieve the on-chain audit record."""
        assert scan_id in self.audits, "Audit not found"
        return self.audits[scan_id]
