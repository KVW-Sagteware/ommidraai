# Imports
# ---
from enum import Enum
# ---

# Classes
# ---
class UserRole(str, Enum):
	owner = "owner"
	admin = "admin"
	member = "member"
	guest = "guest"

class InviteRole(str, Enum):
    admin = "admin"
    member = "member"
    guest = "guest"
# ---

# Helper Functions
# ---
def can_manage_locations(role:UserRole) -> bool:
	return role in {
		UserRole.owner,
		UserRole.admin,
		UserRole.member,
	}

def can_delete_group(role: UserRole) -> bool:
	return role == UserRole.owner

def can_manage_user(actor: UserRole, target: UserRole) -> bool:
	if actor == UserRole.owner:
		return True

	print(f"\n\n---\nActor: {actor}\nTarget: {target}\n---\n\n")

	if actor == UserRole.admin:
		return target in {
			UserRole.member,
			UserRole.guest,
		}

	return False
# ---