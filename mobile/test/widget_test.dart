import "package:contex_mobile/main.dart";
import "package:flutter_test/flutter_test.dart";

void main() {
  testWidgets("Landing page loads", (WidgetTester tester) async {
    await tester.pumpWidget(const ConteXApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 2600));
    await tester.pumpAndSettle();

    expect(find.text("AI photo studio"), findsNothing);
    expect(find.text("Start creating"), findsOneWidget);
    expect(find.textContaining("Transform photos"), findsOneWidget);
    expect(find.text("YOUR CREATIONS"), findsOneWidget);
  });
}
