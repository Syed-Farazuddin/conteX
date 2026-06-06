class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    this.name,
    this.organizationName,
  });

  final String id;
  final String email;
  final String? name;
  final String? organizationName;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final org = json["organization"] as Map<String, dynamic>?;
    return AuthUser(
      id: json["id"] as String,
      email: json["email"] as String,
      name: json["name"] as String?,
      organizationName: org?["name"] as String?,
    );
  }
}
