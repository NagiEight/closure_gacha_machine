import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CustomRollModal extends StatefulWidget {
  final ValueChanged<int> onConfirm;

  const CustomRollModal({super.key, required this.onConfirm});

  static Future<void> show(BuildContext context, ValueChanged<int> onConfirm) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141414),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => CustomRollModal(onConfirm: onConfirm),
    );
  }

  @override
  State<CustomRollModal> createState() => _CustomRollModalState();
}

class _CustomRollModalState extends State<CustomRollModal> {
  final _orundumController = TextEditingController();
  final _originiteController = TextEditingController();
  final _singlePermitController = TextEditingController();
  final _tenPermitController = TextEditingController();

  final _orundumFocus = FocusNode();
  final _originiteFocus = FocusNode();
  final _singlePermitFocus = FocusNode();
  final _tenPermitFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _loadCachedValues();
    _setupFocusListeners();
  }

  // Automatically select text when focused to replace '0' without backspacing
  void _setupFocusListeners() {
    void attachSelectAll(FocusNode focus, TextEditingController controller) {
      focus.addListener(() {
        if (focus.hasFocus && controller.text.isNotEmpty) {
          controller.selection = TextSelection(
            baseOffset: 0,
            extentOffset: controller.text.length,
          );
        }
      });
    }

    attachSelectAll(_orundumFocus, _orundumController);
    attachSelectAll(_originiteFocus, _originiteController);
    attachSelectAll(_singlePermitFocus, _singlePermitController);
    attachSelectAll(_tenPermitFocus, _tenPermitController);
  }

  Future<void> _loadCachedValues() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;

    final cachedOrundum = prefs.getInt('cache_orundum') ?? 0;
    final cachedOriginite = prefs.getInt('cache_originite') ?? 0;
    final cachedSingle = prefs.getInt('cache_single_permits') ?? 0;
    final cachedTen = prefs.getInt('cache_ten_permits') ?? 0;

    setState(() {
      _orundumController.text = cachedOrundum.toString();
      _originiteController.text = cachedOriginite.toString();
      _singlePermitController.text = cachedSingle.toString();
      _tenPermitController.text = cachedTen.toString();
    });
  }

  Future<void> _saveCachedValues() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('cache_orundum', _orundum);
    await prefs.setInt('cache_originite', _originite);
    await prefs.setInt('cache_single_permits', _singlePermits);
    await prefs.setInt('cache_ten_permits', _tenPermits);
  }

  int get _orundum => int.tryParse(_orundumController.text) ?? 0;
  int get _originite => int.tryParse(_originiteController.text) ?? 0;
  int get _singlePermits => int.tryParse(_singlePermitController.text) ?? 0;
  int get _tenPermits => int.tryParse(_tenPermitController.text) ?? 0;

  int get _totalRolls {
    final totalOrundum = _orundum + (_originite * 180);
    return (totalOrundum ~/ 600) + _singlePermits + (_tenPermits * 10);
  }

  int get _leftoverOrundum {
    final totalOrundum = _orundum + (_originite * 180);
    return totalOrundum % 600;
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String label,
    required IconData icon,
  }) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      keyboardType: TextInputType.number,
      style: const TextStyle(
        color: Colors.white,
        fontFamily: 'bender',
        fontSize: 14,
      ),
      onChanged: (_) {
        _saveCachedValues();
        setState(() {});
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.amber, size: 18),
        labelStyle: const TextStyle(color: Colors.white54, fontSize: 13),
        filled: true,
        fillColor: Colors.black26,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.white12),
          borderRadius: BorderRadius.circular(6),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.amber),
          borderRadius: BorderRadius.circular(6),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(
    String label,
    String value, {
    bool isHighlight = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: isHighlight ? Colors.amber : Colors.white60,
              fontFamily: 'bender',
              fontSize: 12,
              letterSpacing: 1.0,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: isHighlight ? Colors.amber : Colors.white,
              fontFamily: 'bender',
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _orundumController.dispose();
    _originiteController.dispose();
    _singlePermitController.dispose();
    _tenPermitController.dispose();
    _orundumFocus.dispose();
    _originiteFocus.dispose();
    _singlePermitFocus.dispose();
    _tenPermitFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rolls = _totalRolls;
    final leftover = _leftoverOrundum;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'RESOURCE CONVERSION',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontFamily: 'bender',
                  letterSpacing: 1.5,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Icon(Icons.receipt_long_rounded, color: Colors.amber, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          _buildInputField(
            controller: _orundumController,
            focusNode: _orundumFocus,
            label: 'Orundum',
            icon: Icons.diamond_outlined,
          ),
          const SizedBox(height: 8),
          _buildInputField(
            controller: _originiteController,
            focusNode: _originiteFocus,
            label: 'Originite Prime',
            icon: Icons.change_history,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _singlePermitController,
                  focusNode: _singlePermitFocus,
                  label: '1x Permit',
                  icon: Icons.confirmation_number_outlined,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildInputField(
                  controller: _tenPermitController,
                  focusNode: _tenPermitFocus,
                  label: '10x Permit',
                  icon: Icons.style_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.black.withValues(),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '--- CONVERSION VOUCHER ---',
                  style: TextStyle(
                    color: Colors.white38,
                    fontFamily: 'bender',
                    fontSize: 10,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                _buildReceiptRow(
                  'Direct Permits',
                  '${_singlePermits + (_tenPermits * 10)} rolls',
                ),
                _buildReceiptRow(
                  'Synthesized Rolls',
                  '${(_orundum + (_originite * 180)) ~/ 600} rolls',
                ),
                _buildReceiptRow('Residual Orundum', '$leftover Orundum'),
                const Divider(color: Colors.white12, height: 16),
                _buildReceiptRow(
                  'TOTAL EXECUTION',
                  '$rolls ROLLS',
                  isHighlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              onPressed: rolls > 0
                  ? () async {
                      // 1. Reset stored cache back to zero after pulling
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setInt('cache_orundum', 0);
                      await prefs.setInt('cache_originite', 0);
                      await prefs.setInt('cache_single_permits', 0);
                      await prefs.setInt('cache_ten_permits', 0);

                      if (!context.mounted) return;
                      Navigator.pop(context);
                      widget.onConfirm(rolls);
                    }
                  : null,
              child: Text(
                'EXECUTE HEADHUNT ($rolls)',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontFamily: 'bender',
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
